param projectName string
param environment string
param location string
param containerAppsEnvId string
param acrLoginServer string
param placeholderImage string

param acrUsername string
param acrPassword string

var appName='ca-frontend-${environment}'

resource frontendApp 'Microsoft.App/containerApps@2023-11-02-preview'={
    name: appName
    location:location
    properties:{
        environmentId:containerAppsEnvId
        configuration:{
            ingress:{
                external:true
                targetPort:8080
                transport:'auto'
            }
            secrets:[
                {
                    name:'acr-password'
                    value:acrPassword
                }
            ]
            registries:[
                {
                    server: acrLoginServer
                    username: acrUsername
                    passwordSecretRef: 'acr-password'
                }
            ]
            activeRevisionsMode: 'Multiple'
        }
        template:{
            containers:[
                {
                    name:'frontend'
                    image:placeholderImage
                    resources:{
                        cpu:json('0.25')
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

output fqdn string =frontendApp.properties.configuration.ingress.fqdn
output appName string =frontendApp.name
output principalId string =frontendApp.Identity.principalId