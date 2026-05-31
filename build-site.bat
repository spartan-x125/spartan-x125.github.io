@echo off
setlocal
cd /d "%~dp0"

echo Building Astro site...
call npm.cmd run build

if errorlevel 1 (
  echo.
  echo Astro build failed. Check the message above.
  pause
  exit /b 1
)

echo.
echo Astro build completed. Static files are available in docs.
pause
