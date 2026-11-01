@echo off
REM Pushes the current branch to github.com/manasshete/job-application-tracker-nc as main.
cd /d "%~dp0"
git remote get-url manas >nul 2>nul || git remote add manas https://github.com/manasshete/job-application-tracker-nc.git
echo Pushing branch:
git branch --show-current
git push -u manas HEAD:main
if errorlevel 1 (echo. & echo Push FAILED - copy the message above and send it to Claude.) else (echo. & echo Push DONE - code is on manasshete/job-application-tracker-nc main.)
pause
