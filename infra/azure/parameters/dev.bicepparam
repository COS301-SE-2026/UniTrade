using '../main.bicep'

param environment='dev'
param location='southafricanorth'
param projectName='devnexus'
param acrName='acrdevnexus'
param adminUsername='devnexusadmin'
param deployAcr=true

param postgresServerName='pg-devnexus-dev'
param createPostgresServer=false