#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "================================================="
echo "  BUILDING STRUCTURAL ROVER PLATFORM FOR RENDER  "
echo "================================================="

echo "--> Step 1: Building React Vite Frontend..."
cd frontend
npm ci || npm install
npm run build
cd ..

echo "--> Step 2: Installing Backend Dependencies..."
cd backend
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cd ..

echo "================================================="
echo "   RENDER BUILD FINISHED SUCCESSFULLY!           "
echo "================================================="
