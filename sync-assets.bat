@echo off
setlocal
cd /d "%~dp0"

echo Syncing music tracks and background images...
call npm.cmd run sync:assets

if errorlevel 1 (
  echo.
  echo Asset sync failed. Check the message above.
  pause
  exit /b 1
)

echo.
echo Asset sync completed.
pause
