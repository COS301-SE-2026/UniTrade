param serverName string
param createServer bool=true

param location string
param adminUsername string ='devnexusadmin'

param adminPassword string =''

var databaseName='unitrade'

resource newServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview'=if(createServer){
    name: serverName
    location: location
    sku:{
        name: 'Standard_B1ms'
        tier: 'Burstable'
    }
    properties:{
        version: 16
        administratorLogin: adminUsername
        storage:{
            storageSizeGB:32
        }
        backup:{
            backupRetentionDays: 7
            geoRedundantBackup: 'Disabled'
        }
    }
}

resource existingServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' existing=if(!createServer){
    name: serverName
}

resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview'={
    parent:createServer? newServer: existingServer
    name: databaseName
}

resource allowAzureServices 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview'={
    parent:createServer? newServer: existingServer
    name: 'AllowAllAzureServicesAndGitHubActions'
    properties:{
        startIpAddress: '0.0.0.0'
        endIpAddress: '255.255.255.255'
    }
}

output fqdn string =createServer ? newServer.properties.fullyQualifiedDomainName: existingServer.properties.fullyQualifiedDomainName
output serverName string=serverName
output database string= databaseName