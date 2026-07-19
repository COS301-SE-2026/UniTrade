param acrName string
param location string

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01'={
    name: acrName
    location: location
    sku: {
        name: 'Basic'
    }
    properties:{
        adminUserEnabled:true
    }
}

output acrName string =acr.name
output loginServer string=acr.properties.loginServer
output acrId string=acr.id
