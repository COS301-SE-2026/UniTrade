targetScope='subscription'

@allowed(['dev','staging','prod'])
param environment string

param location string ='southafricanorth'
param projectName string='unitrade'

param acrName string

param adminUsername string='unitradeadmin'

@secure()
param adminPassword string

param placeholderImage string='mcr.microsoft.com/k8se/quickstart:latest'

var rgName='rg-${projectName}-${environment}'

resource rg 'Microsoft.Resources/resourceGroups@2023-07-01'={
    name:rgName
}

param deployAcr bool=false

module containerRegistry 'modules/container-registry.bicep'=if(deployAcr){
    name: 'deployAcr'
    scope: rg
    params: {
        acrName: acrName
        location: location
    }
}

resource existingAcr 'Microsoft.ContainerRegistry/registries@2023-07-01' existing=if (!deployAcr){
    name: acrName
    scope: resourceGroup('rg-${projectName}-dev')
}

var acrLoginServer=deployAcr ? containerRegistry.outputs.loginServer : existingAcr.properties.loginServer

module containerAppsEnv 'modules/container-apps-env.bicep'={
    name: 'deploy-cae-${environment}'
    scope: rg
    params: {
        projectName: projectName
        environment: environment
        location: location
    }
}

param postgresServerName string
param createPostgresServer bool=true

module postgresql 'modules/postgresql.bicep'={
    name: 'deploy-postgres-${environment}'
    scope: rg
    params: {
        serverName: postgresServerName
        createServer: createPostgresServer
        location: location
        adminUsername: adminUsername
        adminPassword: adminPassword
    }
}

module communicationService 'modules/communication-service.bicep'={
    name: 'deploy-acs-${environment}'
    scope: rg
    params: {
        projectName: projectName
        environment: environment
        location: location
    }
}

module backendApp 'modules/container-app-backend.bicep'={
    name: 'deploy-backend-${environment}'
    scope: rg
    params: {
        projectName: projectName
        environment: environment
        location: location
        containerAppsEnvId: containerAppsEnv.outputs.environmentId
        acrLoginServer: acrLoginServer
        placeholderImage: placeholderImage
    }
}

module frontendApp 'modules/container-app-frontend.bicep'={
    name: 'deploy-frontend'
    scope: rg
    params:{
        projectName: projectName
        environment: environment
        location: location
        containerAppsEnvId: containerAppsEnv.outputs.environmentId
        acrLoginServer: acrLoginServer
        placeholderImage: placeholderImage
    }
}

output resourceGroupName string=rg.name
output acrLoginServer string =acrLoginServer
output backendFqdn string=backendApp.outputs.fqdn 
output frontendFqdn string=frontendApp.outputs.fqdn 
output postgresHost string =postgresql.outputs.fqdn
output containerAppsEnvId=containerAppsEnv.outputs.environmentId
output appInsightsConnectionString string =containerAppsEnv.outputs.appInsightsConnectionString

output backendPrincipalId string =backendApp.outputs.principalId
output frontendPrincipalId=frontendApp.outputs.principalId