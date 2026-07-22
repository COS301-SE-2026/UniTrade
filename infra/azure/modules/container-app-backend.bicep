param projectName string
param environment string
param location string
param containerAppsEnvId string
param acrLoginServer string
param placeholderImage string

//param acrUsername string
//param acrPassword string
param useManagedIdentity bool=true

var appName='ca-backend-${environment}'

resource backendApp 'Microsoft.App/containerApps@2023-11-02-preview'={
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
                    name:'backend'
                    image:placeholderImage
                    resources:{
                        cpu:json('0.5')
                        memory:'1Gi'
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

output fqdn string =backendApp.properties.configuration.ingress.fqdn
output appName string =backendApp.name
output principalId string =backendApp.identity.principalId