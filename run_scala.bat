@echo off
echo ============================================================
echo   STARTING AGILE ROVER SCALA TELEMETRY STREAM ENGINE (Port 8090)
echo ============================================================
cd /d "%~dp0scala-telemetry-service"
call sbt.bat run

