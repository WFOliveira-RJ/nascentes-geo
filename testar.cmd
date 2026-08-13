@echo off
rem Teste local da demo NascentesGeo (duplo clique). Requer Node instalado.
cd /d %~dp0
start "" http://localhost:8123/
node tools\serve.js web 8123
