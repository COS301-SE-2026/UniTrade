IF DB_ID('UniTrade') IS NULL
    CREATE DATABASE UniTrade;
GO

USE master;
GO
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'unitrade_app')
BEGIN
    CREATE LOGIN unitrade_app
    WITH PASSWORD = '$(APP_USER_PASSWORD)',
        CHECK_POLICY = ON,
        CHECK_EXPIRATION = OFF;
END
GO



USE UniTrade;
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'unitrade_app')
BEGIN
    CREATE USER unitrade_app FOR LOGIN unitrade_app;
    ALTER ROLE db_datareader ADD MEMBER unitrade_app;
    ALTER ROLE db_datawriter ADD MEMBER unitrade_app;
END
GO