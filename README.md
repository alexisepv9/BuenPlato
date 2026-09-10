# Buen Plato

Sistema web adaptable para ventas de almuerzos buffet, productos individuales,
inventario y análisis financiero de un local de alimentos.

## Estructura

- `backend`: API REST en Java y Spring Boot.
- `frontend`: aplicación React adaptable a iPhone, Android y escritorio.
- `compose.yaml`: aplicación completa con React/Nginx, Spring Boot y PostgreSQL.

## Requisitos

- Java 21
- Maven 3.9+
- Node.js 22+
- Docker Desktop (opcional, recomendado para PostgreSQL)

## Inicio recomendado con Docker

1. Copiar `.env.example` como `.env`.
2. Ejecutar `docker compose up -d`.
3. Comprobar `docker compose ps`.
4. Abrir `http://localhost`.

Después de modificar código, ejecutar `docker compose up -d --build`.

## Desarrollo sin construir contenedores

1. En `backend`, ejecutar `mvn spring-boot:run`.
2. En `frontend`, ejecutar `npm install` y `npm run dev`.

La interfaz queda en `http://localhost:5173` y la API en
`http://localhost:8080/api`.

## Herramientas visuales

- Swagger: `http://localhost:8080/swagger-ui.html`
- H2 Console: `http://localhost:8080/h2-console`

Para H2 Console:

- JDBC URL: `jdbc:h2:file:./data/buenplato`
- Usuario: `sa`
- Contraseña: vacía

La consola H2 solo está habilitada en desarrollo local. Docker utiliza PostgreSQL.

## Documentación

- [Manual de usuario](MANUAL_DE_USUARIO.md)
- [Documentación técnica](DOCUMENTACION_TECNICA.md)
- [Guía de Docker](GUIA_DOCKER.md)
- [Guía del backend](GUIA_BACKEND.md)
- [Modelo entidad-relación](MODELO_ENTIDAD_RELACION.md)
- [Memoria del proyecto](MEMORIA_PROYECTO.md)

Las cuentas y contraseñas locales se conservan en `CUENTAS_LOCALES.md`, archivo
ignorado deliberadamente por Git. Solicite los accesos al responsable técnico.
