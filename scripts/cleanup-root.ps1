Param(
    [switch]$DryRun
)

# Patterns for automatic cleanup
$patterns = @{
    "logs/build/" = @("build_*.txt", "build*.log", "dev.log", "final*.txt", "final*.log")
    "logs/lint/" = @("eslint-*.txt", "eslint*.log", "lint*.log")
    "logs/tests/" = @("test_*.txt", "test*.log", "jest*.log", "cypress*.log")
    "storage/backups/" = @("backup_*.dump")
    "scripts/tools/" = @("find-file.js", "find-file.mjs", "find-line-numbers.mjs", "search-patterns.mjs", "search-specific-lines.mjs", "count-questions.js", "response.json")
    "scripts/fixes/" = @("temp_*.sql")
    "storage/backups/secure/" = @("cookies*.txt", "cookiejar*")
}

$movedCount = 0
foreach($dest in $patterns.Keys){
    if(-not (Test-Path $dest)){
        if($DryRun){ Write-Output "Would create folder: $dest" } else { New-Item -ItemType Directory -Force -Path $dest | Out-Null }
    }
    
    foreach($pattern in $patterns[$dest]){
        $files = Get-ChildItem -Path "." -Filter $pattern -File -ErrorAction SilentlyContinue
        foreach($file in $files){
            if($DryRun){
                Write-Output "Would move: $($file.Name) -> $dest"
            } else {
                Write-Output "Moving: $($file.Name) -> $dest"
                # Try git mv first to preserve history when tracked
                $gitMv = Start-Process git -ArgumentList @('mv', $file.Name, $dest) -NoNewWindow -Wait -PassThru -ErrorAction SilentlyContinue
                if($gitMv.ExitCode -ne 0){
                    Move-Item $file.FullName "$dest$($file.Name)" -Force
                }
                # Stage destination (ignore .gitignore restrictions)
                Start-Process git -ArgumentList @('add', '-f', "$dest$($file.Name)") -NoNewWindow -Wait -ErrorAction SilentlyContinue | Out-Null
                $movedCount++
            }
        }
    }
}

# Ensure .gitignore contains secure backups ignore and root log files ignore
$gitIgnore = '.gitignore'
$ignoreEntry = "# sensitive backups and secrets`n/storage/backups/secure/*`ncookies*.txt`ncookiejar*"
$logIgnoreEntry = "# log files in root (use /logs/ subdirectories instead)`n/*.txt`n/*.log"

if(Test-Path $gitIgnore){
    $content = Get-Content $gitIgnore -Raw
    
    # Add secure backup ignores if missing
    if($content -notlike '*storage/backups/secure/**'){
        if($DryRun){ Write-Output "Would append secure ignore entries to .gitignore" } else { Add-Content -Path $gitIgnore -Value "`n`n$ignoreEntry"; Write-Output 'Appended secure ignores to .gitignore' }
    } else {
        if($DryRun){ Write-Output ".gitignore already has secure entries" } else { Write-Output ".gitignore already has secure entries" }
    }
    
    # Add root log file ignores if missing
    if($content -notlike "*/*.txt*"){
        if($DryRun){ Write-Output "Would append root log ignore entries to .gitignore" } else { Add-Content -Path $gitIgnore -Value "`n`n$logIgnoreEntry"; Write-Output 'Appended root log file ignores to .gitignore' }
    } else {
        if($DryRun){ Write-Output ".gitignore already has root log ignores" } else { Write-Output ".gitignore already has root log ignores" }
    }
}

if(-not $DryRun){
    Write-Output "✅ Cleanup complete. Moved $movedCount files to appropriate directories."
} else {
    Write-Output 'Cleanup (dry-run) complete.'
}
