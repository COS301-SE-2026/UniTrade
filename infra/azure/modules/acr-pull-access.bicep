param acrName string
param acrResourceGroupName string
param principalId string 


resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01 existing={
    name: acrName
    scope: resourceGroup(acrResourceGroupName)
}

var acrPullRoleId='7f951dda-4ed3-4680-a7ca-43fe172d538d'

resource acrPullAssignment 'Microsoft.Authorization/roleAssignment@2022-04-01'={
    name:guid(acr.id,principalId,acrPullRoleId)
    scope: acr
    properties: {
        roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions',acrPullRoleId)
        principalId: principalId
        principalType: 'ServicePrincipal'
    }
}