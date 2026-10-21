@echo off
REM Tests the Vercel AI Gateway setup: runs index.ts with the key from .env.local
cd /d "%~dp0"
if defined AI_GATEWAY_API_KEY (echo Note: Windows already had an AI_GATEWAY_API_KEY variable. Ignoring it and using .env.local.) else (echo No Windows AI_GATEWAY_API_KEY variable found, using .env.local.)
set AI_GATEWAY_API_KEY=
node -v
node --no-warnings --experimental-strip-types --env-file=.env.local index.ts
if errorlevel 1 (echo. & echo Test FAILED - copy the message above and send it to Claude.) else (echo. & echo Test PASSED - the AI Gateway answered.)
pause
