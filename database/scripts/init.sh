#!/bin/bash

SQLCOMD="/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -C"

for i in {1..50}; do
	if $SQLCOMD -Q "SELECT 1" &> /dev/null; then
		echo "SQL Server ready"
		break
	fi
		echo "Waiting for SQL Server to start...($i)"
		sleep 3
done

set -e

echo "Running sql scripts"

$SQLCOMD -v DB_NAME="$DB_NAME" -v USER_ID="$USER_ID" -v APP_USER_PASSWORD="$APP_USER_PASSWORD" -i /scripts/01-create-schema.sql
$SQLCOMD -i /seeds/01-seed-data.sql


echo "DB successfully created and seeded."


