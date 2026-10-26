[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][string]$ContainerId,
    [Parameter(Mandatory=$true)][string]$RunId,
    [Parameter(Mandatory=$true)][string]$Database,
    [Parameter(Mandatory=$true)][string]$BackendRoot,
    [Parameter(Mandatory=$true)][string]$ResultsDirectory
)
$ErrorActionPreference = 'Stop'
# Invoked only by the fresh-container runner. Never read application connection strings.
$qaMeta = (& docker inspect $ContainerId | ConvertFrom-Json)[0]
if ($ContainerId -notmatch '^[a-f0-9]{64}$' -or $RunId -notmatch '^[a-f0-9]{32}$' -or
    $qaMeta.Id -ne $ContainerId -or $qaMeta.Config.Labels.'com.mommyandsunny.qa.run' -ne $RunId -or
    $Database -ne ('mommy_auth_test_' + $RunId) -or
    @($qaMeta.Mounts | Where-Object { $_.Type -ne 'tmpfs' }).Count -ne 0) { throw 'Migration isolation guard failed.' }
$qaBaseline = Join-Path $ResultsDirectory 'baseline.sql'
$qaUp = Join-Path $ResultsDirectory 'up.sql'
Push-Location $BackendRoot
try {
    & dotnet ef migrations script 0 20261022131113_AddChatProductTags --no-build --project src/MommyAndSunny.Infrastructure --startup-project src/MommyAndSunny.API --output $qaBaseline
    if ($LASTEXITCODE -ne 0) { throw 'Baseline SQL generation failed.' }
    & dotnet ef migrations script 20261022131113_AddChatProductTags 20261026040155_HardenMemberAuthentication --no-build --project src/MommyAndSunny.Infrastructure --startup-project src/MommyAndSunny.API --output $qaUp
    if ($LASTEXITCODE -ne 0) { throw 'Upgrade SQL generation failed.' }
} finally { Pop-Location }
function Invoke-QaSql([string]$Db, [string]$Sql, [switch]$ExpectFailure, [string]$Options = '') {
    if ($Db -notmatch '^mommy_auth_test_[a-f0-9]{32}(_restore|_conflict|_empty)?$') { throw 'Unsafe database name.' }
    $qaFile = Join-Path $ResultsDirectory 'command.sql'
    [IO.File]::WriteAllText($qaFile, $Sql, (New-Object Text.UTF8Encoding($false)))
    & docker cp $qaFile ($ContainerId + ':/tmp/command.sql') | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'SQL copy failed.' }
    $qaArgs = @('exec')
    if ($Options) { $qaArgs += @('--env', ('PGOPTIONS=' + $Options)) }
    $qaArgs += @($ContainerId,'psql','-X','-v','ON_ERROR_STOP=1','-U','mommy_auth_test','-d',$Db,'-At','-f','/tmp/command.sql')
    # Store output only for synthetic data; no credentials or application configuration.
    $qaPreviousPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $qaOutput = & docker @qaArgs 2>&1
        $qaExit = $LASTEXITCODE
    } finally { $ErrorActionPreference = $qaPreviousPreference }
    if ($ExpectFailure) {
        if ($qaExit -eq 0) { throw 'Expected rejection did not occur.' }
        return ($qaOutput | Out-String)
    }
    if ($qaExit -ne 0) { throw ('Synthetic SQL failed: ' + ($qaOutput | Out-String)) }
    return (($qaOutput | Out-String).Trim())
}
function Assert-Qa([bool]$Value, [string]$Message) { if (-not $Value) { throw $Message } }
$qaSeed = @'
INSERT INTO "Users" ("Id","Email","PasswordHash","FullName","AuthProvider","Role","EmailVerified","CreatedAt","UpdatedAt") VALUES
('11111111-1111-1111-1111-111111111111',' Legacy@Example.test ','SYNTHETIC_NOT_A_PASSWORD','Synthetic QA','Local','Customer',true,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO "Carts" ("Id","UserId","CreatedAt","UpdatedAt") VALUES ('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO "Addresses" ("Id","UserId","RecipientName","PhoneNumber","Province","District","Ward","DetailAddress","IsDefault","CreatedAt","UpdatedAt") VALUES
('33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111','Synthetic QA','0900000000','QA','QA','QA','Not a customer address',true,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO "Orders" ("Id","OrderCode","UserId","RecipientName","RecipientPhone","ShippingAddress","Status","PaymentMethod","PaymentStatus","SubTotal","ShippingFee","DiscountAmount","TotalAmount","CreatedAt","UpdatedAt") VALUES
('44444444-4444-4444-4444-444444444444','QA-SYNTHETIC-ONLY','11111111-1111-1111-1111-111111111111','Synthetic QA','0900000000','QA only','Pending','COD','Unpaid',100,0,0,100,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
'@
$qaSnapshot = @'
SELECT md5(string_agg(row, E'\n' ORDER BY row)) FROM (
 SELECT 'users:' || (to_jsonb(u)-'NormalizedEmail'-'ConcurrencyStamp'-'SecurityVersion')::text AS row FROM "Users" u
 UNION ALL SELECT 'orders:' || to_jsonb(o)::text FROM "Orders" o
 UNION ALL SELECT 'carts:' || to_jsonb(c)::text FROM "Carts" c
 UNION ALL SELECT 'addresses:' || to_jsonb(a)::text FROM "Addresses" a
) s;
'@
$qaBaselineText = [IO.File]::ReadAllText($qaBaseline)
$qaUpText = [IO.File]::ReadAllText($qaUp)
Invoke-QaSql $Database $qaBaselineText | Out-Null
Invoke-QaSql $Database $qaSeed | Out-Null
$qaBefore = Invoke-QaSql $Database $qaSnapshot
$qaForeignKeysSql = 'SELECT string_agg(conname || '':'' || pg_get_constraintdef(oid), E''\n'' ORDER BY conname) FROM pg_constraint WHERE contype=''f'' AND conrelid IN (''"Orders"''::regclass,''"Carts"''::regclass,''"Addresses"''::regclass);'
$qaBeforeForeignKeys = Invoke-QaSql $Database $qaForeignKeysSql
& docker exec $ContainerId pg_dump -U mommy_auth_test -d $Database -Fc -f /tmp/synthetic-before.dump
if ($LASTEXITCODE -ne 0) { throw 'Synthetic backup failed.' }
& docker cp ($ContainerId + ':/tmp/synthetic-before.dump') (Join-Path $ResultsDirectory 'synthetic-before.dump') | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Backup artifact copy failed.' }
# Hold a real read lock in another PostgreSQL connection; upgrade must time out and roll back.
$qaLockFile = Join-Path $ResultsDirectory 'hold-lock.sql'
[IO.File]::WriteAllText($qaLockFile, 'BEGIN; LOCK TABLE "Users" IN ACCESS SHARE MODE; SELECT pg_sleep(8); COMMIT;')
& docker cp $qaLockFile ($ContainerId + ':/tmp/hold-lock.sql') | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Lock fixture copy failed.' }
$qaDockerExe = (Get-Command docker).Source
$qaLocker = Start-Process -FilePath $qaDockerExe -ArgumentList @('exec',$ContainerId,'psql','-X','-U','mommy_auth_test','-d',$Database,'-f','/tmp/hold-lock.sql') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $ResultsDirectory 'lock.out') -RedirectStandardError (Join-Path $ResultsDirectory 'lock.err')
$qaLockSeen = $false
for ($qaAttempt=0; $qaAttempt -lt 20; $qaAttempt++) {
    $qaHeld = Invoke-QaSql $Database 'SELECT count(*) FROM pg_locks WHERE relation=''"Users"''::regclass AND mode=''AccessShareLock'' AND granted;'
    if ([int]$qaHeld -gt 0) { $qaLockSeen=$true; break }
    Start-Sleep -Milliseconds 100
}
Assert-Qa $qaLockSeen 'Reader lock not observed.'
$qaLockError = Invoke-QaSql $Database $qaUpText -ExpectFailure -Options '-c lock_timeout=500ms'
Assert-Qa ($qaLockError -match 'lock timeout') 'Upgrade did not reject due to expected lock timeout.'
Assert-Qa ((Invoke-QaSql $Database 'SELECT count(*) FROM information_schema.columns WHERE table_name=''Users'' AND column_name=''NormalizedEmail'';') -eq '0') 'Failed migration left partial DDL.'
if (-not $qaLocker.WaitForExit(15000)) { throw 'Reader lock fixture timed out.' }
$qaLocker.Refresh()
# Windows PowerShell can lose ExitCode for an already-exited redirected process.
# Also require psql's COMMIT acknowledgement and an empty stderr artifact.
$qaLockOutput = [IO.File]::ReadAllText((Join-Path $ResultsDirectory 'lock.out'))
$qaLockStderr = [IO.File]::ReadAllText((Join-Path $ResultsDirectory 'lock.err'))
if (($null -ne $qaLocker.ExitCode -and $qaLocker.ExitCode -ne 0) -or $qaLockOutput -notmatch 'COMMIT' -or $qaLockStderr.Trim()) { throw 'Reader lock fixture failed.' }
$qaTimer = [Diagnostics.Stopwatch]::StartNew()
Invoke-QaSql $Database $qaUpText | Out-Null
$qaTimer.Stop()
Assert-Qa ((Invoke-QaSql $Database $qaSnapshot) -eq $qaBefore) 'Business data or identity changed.'
Assert-Qa ((Invoke-QaSql $Database $qaForeignKeysSql) -eq $qaBeforeForeignKeys) 'Business foreign-key definitions changed.'
$qaChecks = @'
SELECT (SELECT count(*) FROM "Users" WHERE "Id"='11111111-1111-1111-1111-111111111111' AND "NormalizedEmail"='legacy@example.test' AND "SecurityVersion" <> '00000000-0000-0000-0000-000000000000' AND "ConcurrencyStamp" <> '00000000-0000-0000-0000-000000000000') = 1
AND (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('ExternalLogins','ExternalHandoffs','AuthSessions'))=3
AND (SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname IN ('IX_Users_NormalizedEmail','IX_ExternalLogins_Provider_ProviderSubject','IX_ExternalLogins_UserId_Provider'))=3;
'@
Assert-Qa ((Invoke-QaSql $Database $qaChecks) -eq 't') 'Auth backfill or constraints missing.'
$qaUniqueError = Invoke-QaSql $Database 'INSERT INTO "Users" ("Id","Email","FullName","AuthProvider","Role","EmailVerified","CreatedAt","UpdatedAt","NormalizedEmail","ConcurrencyStamp","SecurityVersion") VALUES (''55555555-5555-5555-5555-555555555555'',''different@example.test'',''Synthetic duplicate'',''Local'',''Customer'',true,now(),now(),''legacy@example.test'',gen_random_uuid(),gen_random_uuid());' -ExpectFailure
Assert-Qa ($qaUniqueError -match 'IX_Users_NormalizedEmail') 'Expected normalized-email unique index rejection missing.'
# Verify the actual unique index through a transaction that only inserts known required columns.
# Duplicate and empty legacy data must block BEFORE any auth schema is added.
foreach ($qaCase in @('conflict','empty')) {
    $qaDb = $Database + '_' + $qaCase
    & docker exec $ContainerId createdb -U mommy_auth_test $qaDb
    if ($LASTEXITCODE -ne 0) { throw 'Guard fixture DB creation failed.' }
    Invoke-QaSql $qaDb $qaBaselineText | Out-Null
    Invoke-QaSql $qaDb $qaSeed | Out-Null
    if ($qaCase -eq 'conflict') {
        Invoke-QaSql $qaDb 'INSERT INTO "Users" ("Id","Email","FullName","AuthProvider","Role","EmailVerified","CreatedAt","UpdatedAt") VALUES (''55555555-5555-5555-5555-555555555555'',''legacy@example.test'',''Synthetic duplicate'',''Local'',''Customer'',true,now(),now());' | Out-Null
    } else { Invoke-QaSql $qaDb 'UPDATE "Users" SET "Email"=''   '';' | Out-Null }
    $qaGuardError = Invoke-QaSql $qaDb $qaUpText -ExpectFailure
    Assert-Qa ($qaGuardError -match 'Normalized email conflicts exist') 'Expected legacy email guard missing.'
    Assert-Qa ((Invoke-QaSql $qaDb 'SELECT count(*) FROM information_schema.columns WHERE table_name=''Users'' AND column_name=''NormalizedEmail'';') -eq '0') 'Guard left partial schema.'
}
$qaRestore = $Database + '_restore'
& docker exec $ContainerId createdb -U mommy_auth_test $qaRestore
if ($LASTEXITCODE -ne 0) { throw 'Restore DB creation failed.' }
& docker exec $ContainerId pg_restore --exit-on-error -U mommy_auth_test -d $qaRestore /tmp/synthetic-before.dump
if ($LASTEXITCODE -ne 0) { throw 'Restore failed.' }
Assert-Qa ((Invoke-QaSql $qaRestore $qaSnapshot) -eq $qaBefore) 'Restore business-data checksum differs.'
Assert-Qa ((Invoke-QaSql $qaRestore $qaForeignKeysSql) -eq $qaBeforeForeignKeys) 'Restore foreign-key definitions differ.'
Assert-Qa ((Invoke-QaSql $qaRestore 'SELECT count(*) FROM "__EFMigrationsHistory" WHERE "MigrationId"=''20261026040155_HardenMemberAuthentication'';') -eq '0') 'Backup unexpectedly includes upgraded history.'
[ordered]@{passed=$true; syntheticOnly=$true; baseline='20261022131113_AddChatProductTags'; target='20261026040155_HardenMemberAuthentication'; usersIdAndBusinessRowsPreserved=$true; businessForeignKeysPreserved=$true; normalizedEmailBackfill=$true; duplicateAndEmptyEmailRejected=$true; normalizedEmailUniquenessEnforced=$true; lockTimeoutRolledBack=$true; upgradeFixtureMilliseconds=$qaTimer.ElapsedMilliseconds; backupRestoreChecksumMatches=$true; backupSha256=(Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $ResultsDirectory 'synthetic-before.dump')).Hash; businessChecksum=$qaBefore; productionConnectionUsed=$false} |
 ConvertTo-Json | Tee-Object -LiteralPath (Join-Path $ResultsDirectory 'migration-result.json')
