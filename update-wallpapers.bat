@echo off
setlocal
chcp 65001 >nul
pushd "%~dp0"
if errorlevel 1 goto failed

where node.exe >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Please install Node.js and run this file again.
  goto failed
)
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Please install Node.js and run this file again.
  goto failed
)

if not exist "node_modules\astro\package.json" goto install
if not exist "node_modules\sharp\package.json" goto install
goto import

:install
echo Installing project dependencies...
call npm.cmd ci
if errorlevel 1 goto failed

:import
call npm.cmd run import:wallpapers
if errorlevel 1 goto failed
echo.
echo Ready to commit and push your changes.
popd
pause
exit /b 0

:failed
echo.
echo Wallpaper update failed. Check the message above and try again.
popd
pause
exit /b 1
