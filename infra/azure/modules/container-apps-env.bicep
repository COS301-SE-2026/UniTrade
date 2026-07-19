param projectName string
param environment string
param location string

var logAnalyticsName ='log-${projectName}-${environment}'
var appInsightsName='ai-${projectName}-${environment}'
var containerAppsEnvName='cae-${projectName}-${environment}'

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01'={
    name: logAnalyticsName
    location: location
    properties: {
        sku:{
            name: 'PerGB2018'
        }
        retentionInDays:30
    }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02'={
    name: appInsightsName
    location: location
    kind: 'web'
    properties: {
        Application_Type: 'web'
        WorkspaceResourceId: logAnalytics.id
    }
}

resource containerAppsEnv 'Microsoft.App/managedEnvironments@2025-11-02-preview'={
    name: containerAppsEnvName
    location: location
    properties: {
        appLogsConfiguration: {
            destination: 'log-analytics'
            logAnalyticsConfiguration: {
                customerId: logAnalytics.properties.customerId
                sharedKey: listKeys(logAnalytics.id,logAnalytics.apiVersion).primarySharedKey
            }
        }
    }
}

output environmentId string =containerAppsEnv.id
output environmentName string =containerAppsEnv.name
output appInsightsConnectionString string=appInsights.properties.ConnectionString