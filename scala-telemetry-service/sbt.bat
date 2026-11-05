@echo off
setlocal
set SCRIPT_DIR=%~dp0
java -Xmx2048M -XX:MaxMetaspaceSize=512M -jar "%SCRIPT_DIR%sbt-launch.jar" %*
