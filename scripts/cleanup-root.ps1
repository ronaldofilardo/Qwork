Param(
    [switch]$DryRun
)

$map = @{
    "storage/backups/" = @("backup_nr-bps_db.dump")
    "logs/build/" = @("build-final.txt","build-output.log","build-output.txt","build.log","build2.log","final-build.log","final_build_output.log","dev.log")
    "logs/tests/" = @("test-emissao-output.txt","test-entidade-output.txt","test-full-output.txt","test-full.log","test-output.txt","test-recibo-full.txt","test-result.txt","test-rls-output.txt","test-simple-output.txt","test-summary.txt","test_output.txt","teste-completo.log")
    "scripts/tools/" = @("find-file.js","find-file.mjs","find-line-numbers.mjs","search-patterns.mjs","search-specific-lines.mjs","count-questions.js","response.json")
    "scripts/fixes/" = @("temp_create_login.sql")
    "storage/backups/secure/" = @("cookiejar.txt","cookies.txt","cookies_gestor.txt")
}

foreach($dest in $map.Keys){
    if(-not (Test-Path $dest)){
        if($DryRun){ Write-Output "Would create folder: $dest" } else { New-Item -ItemType Directory -Force -Path $dest | Out-Null }
    }
    foreach($file in $map[$dest]){
        if(Test-Path $file){
            if($DryRun){
                Write-Output "Would move: $file -> $dest"
            } else {
                Write-Output "Moving: $file -> $dest"
                # Try git mv first to preserve history when tracked
                $gitMv = Start-Process git -ArgumentList @('mv', $file, $dest) -NoNewWindow -Wait -PassThru -ErrorAction SilentlyContinue
                if($gitMv.ExitCode -ne 0){
                    Move-Item $file $dest -Force
                }
                # Stage destination
                Start-Process git -ArgumentList @('add', "$dest$file") -NoNewWindow -Wait -ErrorAction SilentlyContinue | Out-Null
            }
        }
    }
}

# Ensure .gitignore contains secure backups ignore
$gitIgnore = '.gitignore'
$ignoreEntry = "# sensitive backups and secrets`n/storage/backups/secure/*`ncookies*.txt`ncookiejar*"
if(Test-Path $gitIgnore){
    $content = Get-Content $gitIgnore -Raw
    if($content -notlike '*storage/backups/secure/**'){
        if($DryRun){ Write-Output "Would append secure ignore entries to .gitignore" } else { Add-Content -Path $gitIgnore -Value "`n`n$ignoreEntry"; Write-Output 'Appended secure ignores to .gitignore' }
    } else {
        if($DryRun){ Write-Output ".gitignore already has secure entries" } else { Write-Output ".gitignore already has secure entries" }
    }
}

Write-Output 'Cleanup complete.'
