@echo off
:startover
CALL update.bat
timeout 2
cls
Ping www.microsoft.com -n 1 -w 1000 > null
if errorlevel 1 (Connection Stable) else call node index.js
if errorlevel 1 echo Internet Connection Is Lost Or Bot Crashed. Attempting To Reconnect..
goto startover
pause >nul