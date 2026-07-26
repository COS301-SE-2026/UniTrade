using '../main.bicep'

param environment='staging'
param location='southafricanorth'
param projectName='devnexus'
param acrName='acrdevnexus'
param adminUsername='devnexusadmin'
param deployAcr=false

param postgresServerName='pg-devnexus-staging'
param createPostgresServer=true