IF DB_ID('$(DB_NAME)') IS NULL
    CREATE DATABASE [$(DB_NAME)];
GO

USE master;
GO
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = '$(USER_ID)')
BEGIN
    CREATE LOGIN [$(USER_ID)]
    WITH PASSWORD = '$(APP_USER_PASSWORD)',
        CHECK_POLICY = ON,
        CHECK_EXPIRATION = OFF;
END
GO



USE [$(DB_NAME)];
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = '$(USER_ID)')
BEGIN
    CREATE USER [$(USER_ID)] FOR LOGIN [$(USER_ID)];
  
END
GO

ALTER ROLE db_datareader ADD MEMBER [$(USER_ID)];
ALTER ROLE db_datawriter ADD MEMBER [$(USER_ID)];

GO