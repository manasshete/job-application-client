@echo off
REM Starts the Pursuitz dev server. Double-click this file, then open http://localhost:3000
cd /d "%~dp0"
where pnpm >nul 2>nul && (pnpm dev) || (npx next dev)
pause
