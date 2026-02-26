@echo off
REM ╔══════════════════════════════════════════════════════════════════════╗
REM ║  MEDACTION - SECURITY AUDIT LAUNCHER (Windows)                       ║
REM ║  Script de lancement rapide pour l'audit de sécurité                ║
REM ╚══════════════════════════════════════════════════════════════════════╝

setlocal EnableDelayedExpansion

REM Configuration par défaut
if "%TARGET_URL%"=="" set TARGET_URL=http://192.168.1.100:3000
if "%AGGRESSIVE%"=="" set AGGRESSIVE=true
if "%THREADS%"=="" set THREADS=20

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║        MEDACTION SECURITY AUDIT FRAMEWORK v2.0               ║
echo ║              Province de Médiouna                            ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo Configuration:
echo   Target URL:  %TARGET_URL%
echo   Aggressive:  %AGGRESSIVE%
echo   Threads:     %THREADS%
echo.

REM Vérifier Node.js
echo [1/4] Vérification des dépendances...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Node.js n'est pas installé
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo   √ Node.js %NODE_VERSION%

REM Installer les dépendances si nécessaire
echo [2/4] Installation des dépendances...
cd /d "%~dp0"
if not exist "node_modules" (
    call npm install --silent
)
echo   √ Dépendances installées

REM Créer le dossier de rapports
echo [3/4] Préparation du dossier de rapports...
if not exist "reports" mkdir reports
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TIMESTAMP=%dt:~0,8%_%dt:~8,6%"
set "REPORT_DIR=reports\audit_%TIMESTAMP%"
if not exist "%REPORT_DIR%" mkdir "%REPORT_DIR%"
echo   √ Dossier créé: %REPORT_DIR%

REM Lancer l'audit
echo [4/4] Lancement de l'audit de sécurité...
echo.
echo ═══════════════════════════════════════════════════════════════
echo.

REM Exécuter le script principal
node audit-master.mjs

echo.
echo ═══════════════════════════════════════════════════════════════
echo AUDIT TERMINE
echo.
echo Rapports sauvegardés dans: %REPORT_DIR%
echo.
dir /b "%REPORT_DIR%" 2>nul || echo   (aucun fichier)
echo.

pause
