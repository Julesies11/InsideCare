# Cleanup script for old pending changes files
# These files have been replaced by separate staff-pending-changes.ts and participant-pending-changes.ts

$filesToRemove = @(
    "src\models\pending-changes.ts",
    "src\lib\pending-changes-factory.ts"
)

foreach ($file in $filesToRemove) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        Write-Host "Removed: $file" -ForegroundColor Green
    } else {
        Write-Host "File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nCleanup complete!" -ForegroundColor Cyan
