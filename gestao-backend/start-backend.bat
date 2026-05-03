@echo off
cd /d "%~dp0"
echo ======================================
echo  Iniciando Backend - Gestao Comunitaria
echo ======================================
echo.
echo URL: http://localhost:8000
echo Docs: http://localhost:8000/docs
echo.
.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000
echo.
echo Backend parado.
pause
