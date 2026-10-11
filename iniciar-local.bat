@echo off
REM Teste local do site com PHP. Requer PHP 8.1+ no PATH (ou o do Laravel Herd) e um MySQL rodando.
set PHPEXE=php
where php >nul 2>nul || set PHPEXE=%USERPROFILE%\.config\herd\bin\php83\php.exe
echo Abrindo http://localhost:8000/  ^|  instalador: http://localhost:8000/instalar/  ^|  painel: http://localhost:8000/admin/
"%PHPEXE%" -S localhost:8000 servidor-local.php
