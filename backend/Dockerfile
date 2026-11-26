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
# Directorios escribibles por el usuario no privilegiado: fotos y H2 de demostración.
# Esto corrige permisos, no convierte el filesystem de Render en almacenamiento persistente.
RUN mkdir -p /app/storage /app/data \
    && chown buenplato:buenplato /app/storage /app/data
COPY --from=build /workspace/target/backend-*.jar /app/backend.jar
# El entrypoint convierte la URL de Render (postgresql://...) al formato JDBC.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod 755 /usr/local/bin/docker-entrypoint.sh
USER buenplato
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
