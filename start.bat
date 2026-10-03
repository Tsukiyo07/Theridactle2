@echo off
setlocal enabledelayedexpansion

echo ==============================================
echo        Dmarrage de Theridactle...
echo ==============================================

:: Find Node.js in common locations if not in PATH
set NODE_EXE=node
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    if exist "C:\Users\tibte\AppData\Local\ms-playwright-go\1.57.0\node.exe" (
        set NODE_EXE="C:\Users\tibte\AppData\Local\ms-playwright-go\1.57.0\node.exe"
    ) else if exist "C:\Program Files\nodejs\node.exe" (
         set NODE_EXE="C:\Program Files\nodejs\node.exe"
    ) else if exist "C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe" (
         set NODE_EXE="C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe"
    )
)

:: Get Local IP Address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"Adresse IPv4"') do (
    set LOCAL_IP=%%a
    set LOCAL_IP=!LOCAL_IP: =!
)

if "!LOCAL_IP!"=="" set LOCAL_IP=localhost

echo.
echo Le serveur va dmarrer.
echo Laissez cette fentre ouverte.
echo.
echo ==============================================
echo JOUEZ EN LOCAL (Rseau WiFi) :
echo Ouvrez ce lien sur votre tlphone ou PC :
echo http://!LOCAL_IP!:3000
echo ==============================================
echo.

%NODE_EXE% server.js
pause
