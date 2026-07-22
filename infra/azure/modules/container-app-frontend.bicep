param projectName string
param environment string
param location string
param containerAppsEnvId string
param acrLoginServer string
param placeholderImage string


var appName='ca-frontend-${environment}'

resource frontendApp 'Microsoft.App/containerApps@2023-11-02-preview'={
    name: appName
    location:location
    identity:{
        type: 'SystemAssigned'
    }
    properties:{
        environmentId:containerAppsEnvId
        configuration:{
            ingress:{
                external:true
                targetPort:8080
                transport:'auto'
            }
            
            activeRevisionsMode: 'Multiple'
        }
        template:{
            containers:[
                {
                    name:'frontend'
                    image:placeholderImage
                    resources:{
                        cpu:json('0.25')
                        memory:'0.5Gi'
                    }
                }
            ]
            scale:{
                minReplicas:1
                maxReplicas:3
            }
        }
    }
}

output fqdn string =frontendApp.properties.configuration.ingress.fqdn
output appName string =frontendApp.name
output principalId string=frontendApp.identity.principalId
