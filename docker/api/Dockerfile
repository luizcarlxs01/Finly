# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copia arquivos de projeto primeiro para aproveitar o cache de camadas do Docker
COPY Finly.sln .
COPY Finly.Api/Finly.Api.csproj Finly.Api/
COPY Finly.Application/Finly.Application.csproj Finly.Application/
COPY Finly.Domain/Finly.Domain.csproj Finly.Domain/
COPY Finly.Infrastructure/Finly.Infrastructure.csproj Finly.Infrastructure/

RUN dotnet restore Finly.sln

# Copia o código-fonte e publica
COPY . .
RUN dotnet publish Finly.Api/Finly.Api.csproj -c Release -o /app/publish --no-restore

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Finly.Api.dll"]
