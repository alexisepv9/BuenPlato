# Etapa 1: compila y prueba el JAR con Maven y Java 21.
FROM maven:3.9.11-eclipse-temurin-21-alpine AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B clean package

# Etapa 2: imagen reducida que solo contiene Java y la aplicación.
FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache curl \
    && addgroup -S buenplato \
    && adduser -S buenplato -G buenplato
WORKDIR /app
RUN mkdir -p /app/storage && chown buenplato:buenplato /app/storage
COPY --from=build /workspace/target/backend-*.jar /app/backend.jar
USER buenplato
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/backend.jar"]
