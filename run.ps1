Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Launching CHRONOS Visual Storage Analysis Website..." -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\storage-visualizer"
npm run dev
