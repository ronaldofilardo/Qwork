Param(
    [switch]$DryRun
)

# Get root directory path
$rootPath = Resolve-Path "." | Select-Object -ExpandProperty Path

# Files to cleanup: ONLY files in root directory that are clearly output logs
# Using explicit file names to avoid accidentally moving project documentation
$filesToMove = @(
    # Build outputs
    @{ files = @(
        "build-check.txt", "build-debug.txt", "build-final-approval.txt", "build-final-schema.txt",
        "build-final-validation.txt", "build-final.txt", "build-log.txt", "build-output-final.txt",
        "build-output-new.txt", "build-output.txt", "build-result-2.txt", "build-result-20-03.txt",
        "build-result-final.txt", "build-result.txt", "build-session.txt", "build-validation-reorg.txt",
        "build_check.txt", "build_current.txt", "build_latest.txt", "build_latest2.txt", "build_latest3.txt",
        "build_latest4.txt", "build_latest_final.txt", "build_legadas.txt", "build_out.txt", "build_out2.txt",
        "build_out_latest.txt", "build_out_new.txt", "build_out_planos.txt", "build_phase5.txt", "build_phase5b.txt",
        "build_progress_bar.txt", "build_stderr.txt", "build_stdout.txt", "build_v5.txt", "build_v5_full.txt",
        "build-final.log", "build-output.log", "build-sentry-test.log", "build_final.log", "build_output.log",
        "dev.log", "restore_staging.log"
       );
       dest = "logs/build/" }
    
    # Lint outputs
    @{ files = @("eslint-comp-remaining.txt", "eslint-full.txt", "eslint-output.txt", "eslint-rem.txt", "lint-output.txt");
       dest = "logs/lint/" }
    
    # Test outputs
    @{ files = @(
        "jest-errors.txt", "jest-result.txt", "rep-test-output.txt", "resp-test-output.txt",
        "test-check.txt", "test-dashboard-output.txt", "test-output-2.txt", "test-output.txt",
        "test_audit_run.txt", "test_output.txt", "test_results.txt", "test_run_current.txt", "test_run_rh.txt",
        "tsc-4-2.txt", "tsc-check.txt", "tsc-output.txt"
       );
       dest = "logs/tests/" }
    
    # Database outputs
    @{ files = @("schema-diff-2026-02-02_18-07-49.txt", "schema-diff-2026-02-02_18-24-20.txt");
       dest = "logs/db/" }
)

# Create log directories
@("logs/build", "logs/lint", "logs/tests", "logs/db") | ForEach-Object {
    if(-not (Test-Path $_)) {
        if(-not $DryRun) { New-Item -ItemType Directory -Force -Path $_ | Out-Null }
    }
}

$movedCount = 0
foreach($group in $filesToMove) {
    $dest = $group.dest
    foreach($fileName in $group.files) {
        $filePath = Join-Path $rootPath $fileName
        
        # Check if file exists in root directory
        if(Test-Path $filePath -PathType Leaf) {
            if($DryRun) {
                Write-Output "Would move: $fileName -> $dest"
            } else {
                Write-Output "Moving: $fileName -> $dest"
                Move-Item $filePath "$dest$fileName" -Force -ErrorAction Continue
                $movedCount++
            }
        }
    }
}

# Ensure .gitignore contains log file ignores
$gitIgnore = '.gitignore'
if(Test-Path $gitIgnore) {
    $content = Get-Content $gitIgnore -Raw
    
    # Check if /*.txt entry exists
    if($content -notlike "*/*.txt*") {
        if(-not $DryRun) {
            Add-Content -Path $gitIgnore -Value "`n# log files in root (use /logs/ subdirectories instead)`n/*.txt"
            Write-Output 'Added root .txt ignore pattern to .gitignore'
        }
    }
}

if(-not $DryRun) {
    Write-Output "✅ Cleanup complete. Moved $movedCount files to appropriate directories."
} else {
    Write-Output "Cleanup (dry-run) complete. Would move $movedCount files."
}
