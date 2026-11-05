@echo off
echo =======================================================
echo Launching CHRONOS Visual Storage Analysis Website...
echo =======================================================
cd /d "%~dp0\storage-visualizer"
call npm run dev
pause
