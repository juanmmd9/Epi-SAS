@echo off
title Portal Mantenimiento EPI - Host local
cd /d "%~dp0"

echo.
echo  Portal de Mantenimiento EPI
echo  ===========================
echo  Host local activo en:
echo    http://localhost:5500/index.html
echo    http://127.0.0.1:5500/index.html
echo.
echo  Para otros equipos en la misma red, usa tu IP local:
echo    http://TU-IP:5500/index.html
echo.
echo  IMPORTANTE: no abras index.html con doble clic.
echo  Usa Chrome en http://localhost:5500/index.html
echo.
echo  Pulsa Ctrl+C para detener el servidor.
echo.

start "" "http://localhost:5500/index.html"
python -m http.server 5500 --bind 0.0.0.0
