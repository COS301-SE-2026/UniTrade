param environment string
param location string
param containerAppsEnvId string
param acrLoginServer string
param placeholderImage string
param useAcrRegistry bool = false
param useRealImage bool=false

var appName = 'ca-clip-${environment}'

resource clipApp 'Microsoft.App/containerApps@2023-11-02-preview' = {
  name: appName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    environmentId: containerAppsEnvId
    configuration: {
      ingress: {
        external: false
        targetPort: useRealImage ? 8000 : 80
        transport: 'auto'
        clientCertificateMode: 'ignore'
      }
      registries: useAcrRegistry
        ? [
            {
              server: acrLoginServer
              identity: 'system'
            }
          ]
        : []

      activeRevisionsMode: 'Single'
    }
    template: {
      containers: [
        {
          name: 'clip'
          image: placeholderImage
          resources: {
            cpu: json('1.0')
            memory: '2.0Gi'
          }
          probes: [
            {
              type: 'Startup'
              httpGet: {
                path: '/health'
                port: 8000
              }
              initialDelaySeconds: 10
              periodSeconds: 10
              failureThreshold: 12
            }
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 8000
              }
              initialDelaySeconds: 40
              periodSeconds: 30
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 2
        rules: [
          {
            name: 'http-scale'
            http: {
              metadata: {
                concurrentRequests: '5'
              }
            }
          }
        ]
      }
    }
  }
}

output fqdn string = clipApp.properties.configuration.ingress.fqdn
output appName string = clipApp.name
output principalId string = clipApp.identity.principalId
