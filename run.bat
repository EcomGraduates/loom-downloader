@echo off
setlocal enabledelayedexpansion

:: Loom Downloader Batch Runner
:: This script provides an easy way to run the loom-dl tool on Windows

title Loom Video Downloader

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Check if the main script exists
if not exist "loom-dl.js" (
    echo ❌ Error: loom-dl.js not found in current directory
    echo Make sure you're running this from the loom-downloader directory
    echo.
    pause
    exit /b 1
)

:: Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Dependencies not found. Installing...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
    echo.
)

:: Display banner
echo.
echo =============================================
echo =          LOOM VIDEO DOWNLOADER            =
echo =============================================
echo.

:: If arguments were passed, run directly
if not "%~1"=="" (
    echo Running: node loom-dl.js %*
    echo.
    node loom-dl.js %*
    goto :end
)

:: Interactive mode
:menu
echo Choose an option:
echo.
echo 1. Download single video (enter URL)
echo 2. Download from list file
echo 3. Show current configuration
echo 4. Reset configuration to defaults
echo 5. Show help
echo 6. Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto single_video
if "%choice%"=="2" goto list_download
if "%choice%"=="3" goto show_config
if "%choice%"=="4" goto reset_config
if "%choice%"=="5" goto show_help
if "%choice%"=="6" goto exit
echo Invalid choice. Please try again.
echo.
goto menu

:single_video
set /p url="Enter Loom video URL: "
if "%url%"=="" (
    echo ❌ No URL provided
    goto menu
)

echo.
echo Additional options (press Enter to use defaults):
set /p quality="Quality (auto/480p/720p/1080p/best) [auto]: "
set /p output="Output directory [downloads]: "
set /p resume="Resume incomplete downloads? (y/n) [y]: "

:: Set defaults
if "%quality%"=="" set quality=auto
if "%output%"=="" set output=downloads
if "%resume%"=="" set resume=y

:: Build command
set cmd=node loom-dl.js --url "%url%" --quality %quality% --out "%output%"
if /i "%resume%"=="y" set cmd=%cmd% --resume
if /i "%resume%"=="n" set cmd=%cmd% --no-resume

echo.
echo Running: %cmd%
echo.
%cmd%
goto end_with_pause

:list_download
set /p listfile="Enter path to list file [example-list.txt]: "
if "%listfile%"=="" set listfile=example-list.txt

if not exist "%listfile%" (
    echo ❌ File "%listfile%" not found
    goto menu
)

echo.
echo Additional options (press Enter to use defaults):
set /p prefix="Filename prefix: "
set /p quality="Quality (auto/480p/720p/1080p/best) [auto]: "
set /p output="Output directory [downloads]: "
set /p timeout="Timeout between downloads in ms [1000]: "

:: Set defaults
if "%quality%"=="" set quality=auto
if "%output%"=="" set output=downloads
if "%timeout%"=="" set timeout=1000

:: Build command
set cmd=node loom-dl.js --list "%listfile%" --quality %quality% --out "%output%" --timeout %timeout%
if not "%prefix%"=="" set cmd=%cmd% --prefix "%prefix%"

echo.
echo Running: %cmd%
echo.
%cmd%
goto end_with_pause

:show_config
echo.
node loom-dl.js --show-config
echo.
pause
goto menu

:reset_config
echo.
echo Are you sure you want to reset configuration to defaults? (y/n)
set /p confirm=
if /i "%confirm%"=="y" (
    node loom-dl.js --reset-config
) else (
    echo Configuration reset cancelled.
)
echo.
pause
goto menu

:show_help
echo.
node loom-dl.js --help
echo.
pause
goto menu

:end_with_pause
echo.
echo Press any key to return to menu...
pause >nul
goto menu

:end
echo.
echo Thank you for using Loom Video Downloader!

:exit
endlocal