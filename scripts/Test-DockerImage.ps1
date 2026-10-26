[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$Image)
$ErrorActionPreference = 'Stop'
if ($Image -notmatch '^mommy-qa-(api|web):qa-[a-z0-9]+$') { throw 'Only locally built QA tags are accepted.' }
$qaRun = [Guid]::NewGuid().ToString('N')
$qaRoot = Join-Path (Split-Path -Parent $PSScriptRoot) ('.next\qa\image-' + $qaRun)
New-Item -ItemType Directory -Force -Path $qaRoot | Out-Null
$qaImage = (& docker image inspect $Image | ConvertFrom-Json)[0]
if ($LASTEXITCODE -ne 0) { throw 'Image unavailable.' }
if (-not $qaImage.Config.User -or $qaImage.Config.User -in @('root','0','0:0')) { throw 'Runtime must be non-root.' }
foreach ($qaEnv in $qaImage.Config.Env) {
    if ($qaEnv -match '^(Jwt__Secret|ConnectionStrings__|Smtp__Password|POSTGRES_PASSWORD|Authentication__.*Secret)') { throw 'Runtime image contains credential configuration.' }
}
$qaId = (& docker create --label ('com.mommyandsunny.qa.image=' + $qaRun) $Image | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $qaId -notmatch '^[a-f0-9]{64}$') { throw 'Image inspection container failed.' }
try {
    $qaTar = Join-Path $qaRoot 'filesystem.tar'
    & docker export --output $qaTar $qaId
    if ($LASTEXITCODE -ne 0) { throw 'Image export failed.' }
    # Windows bsdtar rejects some valid GNU/PAX entries from dotnet base images.
    # Read names only with Python; never extract or execute image contents.
    $qaFiles = @(& python (Join-Path $PSScriptRoot 'list-image-files.py') $qaTar)
    if ($LASTEXITCODE -ne 0) { throw 'Image listing failed.' }
    $qaForbidden = @($qaFiles | Where-Object {
        $_ -match '^app/' -and ($_ -match '(^|/)(\.env[^/]*|\.git|appsettings[^/]*\.json)(/|$)' -or
        $_ -match '\.(dump|backup|bak|pem|key|pfx|p12)$' -or $_ -match '^app/\.next/qa/')
    })
    if ($qaForbidden.Count) { throw ('Forbidden application files in image: ' + ($qaForbidden -join ', ')) }
    [ordered]@{ image=$Image; imageId=$qaImage.Id; nonRoot=$true; forbiddenApplicationFiles=0; credentialEnvironmentKeys=0; containerStarted=$false } |
        ConvertTo-Json | Tee-Object -LiteralPath (Join-Path $qaRoot 'result.json')
} finally {
    $qaMeta = (& docker inspect $qaId | ConvertFrom-Json)[0]
    if ($qaMeta.Id -ne $qaId -or $qaMeta.Config.Labels.'com.mommyandsunny.qa.image' -ne $qaRun) { throw 'Ownership mismatch; refusing removal.' }
    & docker rm $qaId | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Inspection cleanup failed.' }
}
