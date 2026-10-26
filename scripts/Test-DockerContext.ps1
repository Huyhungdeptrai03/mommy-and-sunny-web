[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$ContextRoot, [ValidateSet('web','api')][string]$Kind)
$ErrorActionPreference = 'Stop'
$qaRoot = Join-Path (Split-Path -Parent $PSScriptRoot) ('.next\qa\context-' + [Guid]::NewGuid().ToString('N'))
$qaContext = Join-Path $qaRoot 'input'
$qaExport = Join-Path $qaRoot 'export'
New-Item -ItemType Directory -Force -Path $qaContext | Out-Null
Copy-Item -LiteralPath (Join-Path $ContextRoot '.dockerignore') -Destination (Join-Path $qaContext '.dockerignore')
$qaExcluded = @('.env', '.env.local', 'secrets/token.key', 'secrets.json', 'mommy-son-backup.dump', 'backup.bak', 'backup.sql.gz', 'backup.dump.gz', '.git/config', 'tests/fixture.txt', 'artifacts/test.trx')
$qaRequired = if ($Kind -eq 'web') { @('package.json','package-lock.json','app/page.tsx','public/logo.png','next.config.ts') } else {
    $qaExcluded += @('src/App/appsettings.Production.json', 'src/App/bin/private.dll', 'src/App/obj/project.assets.json', 'src/App/Properties/launchSettings.json')
    @('src/App/App.csproj','src/App/Program.cs','src/Domain/Entities/User.cs','src/Infrastructure/Migrations/Example.cs','Directory.Build.props')
}
foreach ($qaPath in ($qaExcluded + $qaRequired)) {
    $qaTarget = Join-Path $qaContext $qaPath
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $qaTarget) | Out-Null
    'SYNTHETIC_NON_SECRET_CANARY' | Set-Content -Encoding UTF8 -LiteralPath $qaTarget
}
$qaProbe = Join-Path $qaRoot 'probe.Dockerfile'
"FROM scratch`nCOPY . /context/" | Set-Content -Encoding UTF8 -LiteralPath $qaProbe
& docker build --file $qaProbe --output ('type=local,dest=' + $qaExport) $qaContext
if ($LASTEXITCODE -ne 0) { throw 'Docker context probe failed.' }
foreach ($qaPath in $qaExcluded) { if (Test-Path -LiteralPath (Join-Path $qaExport ('context/' + $qaPath))) { throw ('Sensitive canary entered Docker context: ' + $qaPath) } }
foreach ($qaPath in $qaRequired) { if (-not (Test-Path -LiteralPath (Join-Path $qaExport ('context/' + $qaPath)))) { throw ('Required build input was excluded: ' + $qaPath) } }
[pscustomobject]@{ kind=$Kind; excludedCanaries=$qaExcluded.Count; requiredInputs=$qaRequired.Count; passed=$true; actualSecretsRead=$false } |
    ConvertTo-Json | Tee-Object -LiteralPath (Join-Path $qaRoot 'result.json')
