#!/bin/bash
echo "============================================================"
echo "  STARTING AGILE ROVER SCALA TELEMETRY STREAM ENGINE (Port 8090)"
echo "============================================================"
cd "$(dirname "$0")/scala-telemetry-service"
chmod +x sbt 2>/dev/null || true
./sbt run

