[CmdletBinding()]
param(
    [string]$BackendRoot = 'C:\Users\hungd\MommyAndSunny',
    [switch]$StartDockerDesktop,
    [ValidateSet('Postgres', 'All', 'Migration')][string]$Suite = 'Postgres'
)

$ErrorActionPreference = 'Stop'
$authFrontendRoot = Split-Path -Parent $PSScriptRoot
$authBackendRoot = (Resolve-Path -LiteralPath $BackendRoot).Path
$authProject = Join-Path $authBackendRoot 'tests\MommyAndSunny.IntegrationTests\MommyAndSunny.IntegrationTests.csproj'
if (-not (Test-Path -LiteralPath $authProject)) { throw 'Backend test project was not found.' }

# Deliberately do not read appsettings, compose, .env, user-secrets, or existing DBs.
if ($env:DOCKER_HOST -and $env:DOCKER_HOST -notmatch '^npipe://') {
    throw 'Refusing a non-local DOCKER_HOST.'
}
$authEndpoint = (& docker context inspect --format '{{.Endpoints.docker.Host}}' | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $authEndpoint -notmatch '^npipe://') {
    throw 'This Windows runner requires a local Docker named pipe, never a remote engine.'
}
function Test-AuthDockerEngine {
    try {
        $authOutput = & docker version --format '{{.Server.Version}}' 2>&1
        return $LASTEXITCODE -eq 0
    } catch { return $false }
}
if (-not (Test-AuthDockerEngine)) {
    if (-not $StartDockerDesktop) { throw 'Docker engine is stopped. Start it explicitly or pass -StartDockerDesktop.' }
    $authDockerExecutable = (Get-Command docker -ErrorAction Stop).Source
    $authLauncher = Start-Process -FilePath $authDockerExecutable -ArgumentList @('desktop', 'start', '--detach') -WindowStyle Hidden -PassThru
    # Start-Process -Wait waits for the entire process tree on Windows, including
    # the long-lived desktop engine. Wait only for the detached CLI launcher.
    if (-not $authLauncher.WaitForExit(15000)) { throw 'Docker Desktop launcher timed out; inspect engine status before retrying.' }
    if ($authLauncher.ExitCode -ne 0) { throw 'Docker Desktop could not be started.' }
    $authReady = $false
    for ($authAttempt = 0; $authAttempt -lt 60; $authAttempt++) {
        if (Test-AuthDockerEngine) { $authReady = $true; break }
        if ($authAttempt % 10 -eq 0) { Write-Output 'Waiting for local Docker engine...' }
        Start-Sleep -Seconds 1
    }
    if (-not $authReady) { throw 'Local Docker engine is unavailable; no database was used.' }
}

$authRunId = [Guid]::NewGuid().ToString('N')
$authContainerName = 'mommy-auth-qa-' + $authRunId
$authDatabase = 'mommy_auth_test_' + $authRunId
$authImage = 'postgres:17-alpine'
$authResults = Join-Path $authFrontendRoot ('.next\qa\postgres-' + $authRunId)
$authCreated = $false
$authPreviousEnvironment = @{}
foreach ($authKey in @('MOMMY_AUTH_TEST_POSTGRES', 'POSTGRES_PASSWORD', 'POSTGRES_DB', 'POSTGRES_USER')) {
    $authPreviousEnvironment[$authKey] = [Environment]::GetEnvironmentVariable($authKey, 'Process')
}
try {
    # Fresh container, ephemeral credentials, tmpfs data. No host/bind/named volumes.
    $authImagePresent = $false
    try { & docker image inspect $authImage 2>&1 | Out-Null; $authImagePresent = $LASTEXITCODE -eq 0 } catch { }
    if (-not $authImagePresent) {
        & docker pull $authImage
        if ($LASTEXITCODE -ne 0) { throw 'Unable to obtain the isolated PostgreSQL image.' }
    }
    $env:POSTGRES_PASSWORD = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
    $env:POSTGRES_DB = $authDatabase
    $env:POSTGRES_USER = 'mommy_auth_test'
    $authContainerId = (& docker run --detach --rm --name $authContainerName `
        --label ('com.mommyandsunny.qa.run=' + $authRunId) `
        --publish '127.0.0.1::5432' --memory 512m --pids-limit 128 `
        --tmpfs '/var/lib/postgresql/data:rw,nosuid,size=512m' `
        --env POSTGRES_PASSWORD --env POSTGRES_DB --env POSTGRES_USER $authImage | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $authContainerId -notmatch '^[a-f0-9]{64}$') { throw 'Fresh test container creation failed.' }
    $authCreated = $true
    $authMetadata = (& docker inspect $authContainerId | ConvertFrom-Json)[0]
    $authPorts = $authMetadata.NetworkSettings.Ports.'5432/tcp'
    if ($authMetadata.Config.Labels.'com.mommyandsunny.qa.run' -ne $authRunId -or
        $authMetadata.Id -ne $authContainerId -or $authPorts.Count -ne 1 -or
        $authPorts[0].HostIp -ne '127.0.0.1' -or
        @($authMetadata.Mounts | Where-Object { $_.Type -ne 'tmpfs' }).Count -ne 0 -or
        $authDatabase -notmatch '^mommy_auth_test_[a-f0-9]{32}$') {
        throw 'Isolation verification failed. No test connection will be opened.'
    }
    $authPort = [int]$authPorts[0].HostPort
    if ($authPort -le 0 -or $authPort -gt 65535) { throw 'Invalid test port.' }
    $authPostgresReady = $false
    for ($authAttempt = 0; $authAttempt -lt 45; $authAttempt++) {
        try {
            & docker exec $authContainerId pg_isready --host 127.0.0.1 --username mommy_auth_test --dbname $authDatabase 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) { $authPostgresReady = $true; break }
        } catch { }
        Start-Sleep -Seconds 1
    }
    if (-not $authPostgresReady) { throw 'The isolated PostgreSQL did not become ready.' }
    $authInitialTables = (& docker exec $authContainerId psql --no-psqlrc --username mommy_auth_test --dbname $authDatabase --tuples-only --no-align --command "SELECT count(*) FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema');" | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $authInitialTables -ne '0') { throw 'Test database is not empty; refusing to run.' }
    New-Item -ItemType Directory -Force -Path $authResults | Out-Null
    $authIsolation = [ordered]@{
        runId = $authRunId; containerId = $authContainerId; image = $authImage
        imageId = $authMetadata.Image; host = '127.0.0.1'; port = $authPort
        database = $authDatabase; initialTables = 0; storage = 'tmpfs'
        applicationConfigurationRead = $false; productionConnectionUsed = $false
    }
    $authIsolation | ConvertTo-Json | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $authResults 'isolation.json')
    Write-Output ('Isolation verified: new ' + $authImage + ', loopback-only port, fresh mommy_auth_test_* DB, tmpfs, no application configuration.')
    $env:MOMMY_AUTH_TEST_POSTGRES = 'Host=127.0.0.1;Port=' + $authPort + ';Database=' + $authDatabase + ';Username=mommy_auth_test;Password=' + $env:POSTGRES_PASSWORD + ';Pooling=false;Timeout=10;Command Timeout=45;Include Error Detail=false'
    if ($Suite -eq 'Migration') {
        & (Join-Path $PSScriptRoot 'Test-MigrationRehearsal.ps1') -ContainerId $authContainerId -RunId $authRunId -Database $authDatabase -BackendRoot $authBackendRoot -ResultsDirectory $authResults
        return
    }
    $authTestArguments = @('test', $authProject, '--no-restore', '--logger', 'trx;LogFileName=postgres-auth.trx',
        '--logger', 'console;verbosity=minimal', '--results-directory', $authResults)
    if ($Suite -eq 'Postgres') { $authTestArguments += @('--filter', 'FullyQualifiedName~PostgresMemberAuthTests') }
    & dotnet @authTestArguments
    $authTestExit = $LASTEXITCODE
    if ($Suite -eq 'All') {
        $authUnitProject = Join-Path $authBackendRoot 'tests\MommyAndSunny.UnitTests\MommyAndSunny.UnitTests.csproj'
        & dotnet test $authUnitProject --no-restore --logger 'trx;LogFileName=unit-tests.trx' `
            --logger 'console;verbosity=minimal' --results-directory $authResults
        if ($LASTEXITCODE -ne 0) { $authTestExit = $LASTEXITCODE }
    }
    $authRemainingSchemas = (& docker exec $authContainerId psql --no-psqlrc --username mommy_auth_test --dbname $authDatabase --tuples-only --no-align --command "SELECT count(*) FROM information_schema.schemata WHERE schema_name LIKE 'auth_test_%';" | Out-String).Trim()
    [ordered]@{ exitCode = $authTestExit; suite = $Suite; remainingTestSchemas = $authRemainingSchemas; resultsDirectory = $authResults } |
        ConvertTo-Json | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $authResults 'result.json')
    Write-Output ('PostgreSQL test exit code: ' + $authTestExit + '; remaining test schemas: ' + $authRemainingSchemas)
    Write-Output ('Evidence: ' + $authResults)
    if ($authTestExit -ne 0) { throw 'PostgreSQL tests failed; see sanitized test artifacts.' }
    if ($authRemainingSchemas -ne '0') { throw 'Test schemas were not cleaned up; the isolated container will still be removed.' }
} finally {
    foreach ($authKey in $authPreviousEnvironment.Keys) {
        [Environment]::SetEnvironmentVariable($authKey, $authPreviousEnvironment[$authKey], 'Process')
    }
    if ($authCreated) {
        # Delete only the exact fresh container whose generated ownership label matches.
        # Parse JSON in memory. Native PowerShell argument quoting can strip the
        # quotes needed by a Go template; never fall back to unchecked deletion.
        $authCleanupMetadata = (& docker inspect $authContainerId | ConvertFrom-Json)[0]
        $authOwner = $authCleanupMetadata.Config.Labels.'com.mommyandsunny.qa.run'
        if ($authOwner -ne $authRunId -or $authCleanupMetadata.Id -ne $authContainerId) { throw 'Container ownership changed; refusing cleanup.' }
        & docker rm --force $authContainerId | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'Could not remove the isolated test container.' }
        Write-Output 'Removed only the owned PostgreSQL test container; ephemeral data and credentials discarded.'
    }
}
