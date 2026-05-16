@echo off
cd /d "%~dp0"
echo Starting EisGard dev server on http://localhost:3000
echo.
npm.cmd run dev:local
pause
