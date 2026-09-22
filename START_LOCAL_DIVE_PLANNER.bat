@echo off
setlocal
title Florida Keys Dive Planner - Local Launcher
cd /d "%~dp0"

set "APP_URL=http://127.0.0.1:4173"
set "GEOSERVER_URL=http://localhost:8080/geoserver/diveplanner/ows?service=WFS&version=1.0.0&request=GetCapabilities"

echo Checking local GeoServer...
curl.exe --silent --fail --max-time 10 --output NUL "%GEOSERVER_URL%"
if errorlevel 1 (
  echo.
  echo Local GeoServer is not available at http://localhost:8080/geoserver
  echo Please start GeoServer manually, then run this launcher again.
  echo.
  pause
  exit /b 1
)

where npm >NUL 2>&1
if errorlevel 1 (
  echo.
  echo npm was not found. Install or enable Node.js before starting the app.
  echo.
  pause
  exit /b 1
)

curl.exe --silent --fail --max-time 2 --output NUL "%APP_URL%" >NUL 2>&1
if not errorlevel 1 (
  echo The local app is already running at %APP_URL%
  start "" "%APP_URL%"
  exit /b 0
)

set "LAN_IP="
for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "$items=Get-NetIPConfiguration; foreach($item in $items){if($item.IPv4DefaultGateway -ne $null -and $item.NetAdapter.Status -eq 'Up'){Write-Output $item.IPv4Address.IPAddress; break}}"`) do set "LAN_IP=%%I"

echo Local GeoServer is ready.
echo Starting the app at %APP_URL%
if defined LAN_IP echo Phone URL: http://%LAN_IP%:4173
echo If Windows Firewall asks, allow access only on Private networks.
echo.

start "Florida Keys Dive Planner - Vite" cmd /k "cd /d ""%~dp0"" && npm run dev"

echo Waiting for Vite...
for /l %%A in (1,1,30) do (
  curl.exe --silent --fail --max-time 1 --output NUL "%APP_URL%" >NUL 2>&1
  if not errorlevel 1 goto app_ready
  ping.exe -n 2 127.0.0.1 >NUL
)

echo.
echo Vite did not become ready on port 4173.
echo Check the Vite window for details.
pause
exit /b 1

:app_ready
start "" "%APP_URL%"
echo The local app is ready.
exit /b 0
