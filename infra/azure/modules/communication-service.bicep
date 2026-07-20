param  string projectName

var acsName='acs-${projectName}'
var emailServiceName='email-${projectName}'
var domainName='AzureManagedDomain'


resource emailService 'Microsoft.Communication/emailServices@2023-04-01'={
    name:emailServiceName
    location: 'global'
}

resource domain 'Microsoft.Communication/emailServices/domains@2023-04-01'={
    parent: emailService
    name: domainName
    location: 'global'
    properties: {
        domainManagement: 'AzureManaged'
    }
}

resource acs 'Microsoft.Communication/communicationServices@2023-04-01'={
    name: acsName
    location: 'global
    properties: {
        dataLocation: 'Africa'
        linkedDomains: [
            domain.id
        ]
    }
}

output senderAddress string='DoNotReply@${domain.properties.mailFromSenderDomain}'
output connectionString string=acs.listKeys().primaryConnectionString
output acsName string=acs.name
