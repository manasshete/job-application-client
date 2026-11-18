@echo off
REM Pushes the current branch to both origin (Vercel production) and manas repos.
cd /d "%~dp0"
echo Pushing branch:
git branch --show-current
git push origin HEAD:main
git push manas HEAD:main
if errorlevel 1 (echo. & echo Push FAILED) else (echo. & echo Push DONE - code is live on Vercel and GitHub.)
pause
