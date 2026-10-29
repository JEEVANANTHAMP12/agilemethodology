@echo off
title Structural Health & Crack Detection Rover System - Backend
echo ============================================================
echo   Starting Autonomous Rover Inspection Backend (MySQL)
echo ============================================================

cd /d "%~dp0backend"
python main.py
pause
