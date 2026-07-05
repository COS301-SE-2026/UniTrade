FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY UniTrade.sln ./

COPY src/backend/Api/Api.csproj src/backend/Api/
COPY src/backend/Infrastructure/Infrastructure.csproj src/backend/Infrastructure/
COPY src/backend/Modules/Modules.csproj src/backend/Modules/

RUN dotnet restore src/backend/Api/Api.csproj

COPY src/backend/ src/backend/

ARG BUILD_CONFIGURATION=Release
RUN dotnet publish  src/backend/Api/Api.csproj -c $BUILD_CONFIGURATION -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .
USER app
ENTRYPOINT ["dotnet", "Api.dll"]
