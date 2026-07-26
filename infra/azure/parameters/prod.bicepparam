using '../main.bicep'

param environment='prod'
param location='southafricanorth'
param projectName='devnexus'
param acrName='acrdevnexus'
param adminUsername='devnexusadmin'
param deployAcr=false

param postgresServerName='pg-devnexus-prod'
param createPostgresServer=true