[CmdletBinding()]
param([switch]$CheckNginx)
$ErrorActionPreference='Stop'
$qaSource = Join-Path (Split-Path -Parent $PSScriptRoot) 'deployment\staging'
$qaFixture = Join-Path (Split-Path -Parent $PSScriptRoot) ('.next\qa\compose-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path (Join-Path $qaFixture 'secrets') | Out-Null
foreach ($qaName in @('compose.yaml','compose.qa-mock.yaml','nginx.conf.template')) {
    Copy-Item -LiteralPath (Join-Path $qaSource $qaName) -Destination (Join-Path $qaFixture $qaName)
}
# .invalid is a rendering canary only. No DNS, server or provider is contacted.
@'
STAGING_PROJECT=mommy-qa-template-check
STAGING_HOST=staging.qa.invalid
STAGING_ORIGIN=https://staging.qa.invalid
STAGING_SUBNET=172.31.250.0/24
STAGING_PROXY_IP=172.31.250.10
WEB_IMAGE=canary-web:qa
API_IMAGE=canary-api:qa
POSTGRES_IMAGE=postgres:17-alpine
NGINX_IMAGE=nginx:stable-alpine
'@ | Set-Content -Encoding ASCII -LiteralPath (Join-Path $qaFixture 'canary.env')
'POSTGRES_DB=synthetic_only' | Set-Content -Encoding ASCII -LiteralPath (Join-Path $qaFixture 'secrets\postgres.env')
'QA_CANARY=not_a_secret' | Set-Content -Encoding ASCII -LiteralPath (Join-Path $qaFixture 'secrets\api.env')
foreach ($qaMode in @('staging','mock')) {
    $qaArgs = @('compose','--env-file',(Join-Path $qaFixture 'canary.env'),'-f',(Join-Path $qaFixture 'compose.yaml'))
    if ($qaMode -eq 'mock') { $qaArgs += @('-f',(Join-Path $qaFixture 'compose.qa-mock.yaml')) }
    & docker @qaArgs config --quiet
    if ($LASTEXITCODE -ne 0) { throw 'Compose template validation failed.' }
    $qaJson = (& docker @qaArgs config --format json | ConvertFrom-Json)
    if ($LASTEXITCODE -ne 0) { throw 'Compose rendering failed.' }
    if ($qaJson.services.postgres.ports -or $qaJson.services.api.ports -or $qaJson.services.web.ports) { throw 'Private service unexpectedly exposed.' }
    if ($qaJson.services.proxy.ports[0].host_ip -ne '127.0.0.1') { throw 'Proxy must default to loopback.' }
    if ($qaJson.services.api.environment.Database__ApplyMigrationsOnStartup -ne 'false') { throw 'Automatic migration enabled.' }
    $qaExpectedEnvironment = if ($qaMode -eq 'mock') { 'Development' } else { 'Staging' }
    if ($qaJson.services.api.environment.ASPNETCORE_ENVIRONMENT -ne $qaExpectedEnvironment) { throw 'Wrong environment separation.' }
    if ($qaJson.services.proxy.environment.NGINX_ENVSUBST_FILTER -ne '^STAGING_HOST') { throw 'nginx variables would be incorrectly substituted.' }
}
$qaNginxPassed = $false
if ($CheckNginx) {
    $qaOpenSsl = 'C:\Program Files\Git\usr\bin\openssl.exe'
    if (-not (Test-Path -LiteralPath $qaOpenSsl)) { throw 'Git OpenSSL is required for the synthetic certificate fixture.' }
    $qaPreviousPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference='Continue'
        & $qaOpenSsl req -x509 -newkey rsa:2048 -nodes -days 1 -subj '/CN=staging.qa.invalid' -addext 'subjectAltName=DNS:staging.qa.invalid' -keyout (Join-Path $qaFixture 'secrets\tls.key') -out (Join-Path $qaFixture 'secrets\tls.crt') 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'Synthetic certificate generation failed.' }
    } finally { $ErrorActionPreference=$qaPreviousPreference }
    # Syntax check only. No listening server, application services or external network.
    & docker run --rm --network none --memory 128m --pids-limit 64 `
        --label com.mommyandsunny.qa.template=syntax-only `
        --add-host api:127.0.0.1 --add-host web:127.0.0.1 `
        --env STAGING_HOST=staging.qa.invalid --env NGINX_ENVSUBST_FILTER=^STAGING_HOST `
        --mount ('type=bind,source=' + (Join-Path $qaFixture 'nginx.conf.template') + ',target=/etc/nginx/templates/default.conf.template,readonly') `
        --mount ('type=bind,source=' + (Join-Path $qaFixture 'secrets') + ',target=/etc/nginx/tls,readonly') `
        nginx:stable-alpine nginx -t
    if ($LASTEXITCODE -ne 0) { throw 'nginx syntax validation failed.' }
    $qaNginxPassed=$true
}
[ordered]@{passed=$true; stagingAndSeparateMockRendered=$true; nginxSyntaxChecked=$qaNginxPassed; productionResourcesUsed=$false; applicationContainersStarted=$false} |
    ConvertTo-Json | Tee-Object -LiteralPath (Join-Path $qaFixture 'result.json')
