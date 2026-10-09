# Comandos de arranque de Buen Plato

## Comprobar los documentos de impresión

Desde la raíz, después de instalar las dependencias del frontend:

```bat
node scripts/test-receipts.mjs
```

Comprueba que el ticket esté identificado como no tributario, que cocina no
reciba precios y que los textos se impriman sin interpretarse como HTML.
No envía papel a ninguna impresora ni sustituye una prueba física de 80 mm.

Guía para **Windows CMD**. Ejecuta cada bloque según lo que necesites.
No ejecutes todos seguidos: Docker y desarrollo son alternativas.

## 1. Inicio habitual con Docker

Abre Docker Desktop y espera que el motor esté iniciado. En CMD:

```bat
cd /d C:\Users\Willy\Documents\flujo
docker info
docker compose up -d
docker compose ps
```

- `cd /d`: cambia a la carpeta raíz, incluso desde otra unidad.
- `docker info`: comprueba que el motor está disponible.
- `up -d`: inicia web, Java y PostgreSQL en segundo plano.
- `ps`: muestra el estado; espera que los servicios estén `healthy`.

Abre **http://localhost/**. Si cambiaste WEB_PORT en .env, añade ese puerto.
No necesitas iniciar Maven ni Vite cuando usas Docker.

## 2. Primera ejecución o cambios de código

Desde la raíz:

```bat
docker compose up -d --build
```

Reconstruye con el código actual y arranca. Puede tardar varios minutos y
descargar dependencias. Conserva los volúmenes. Reiniciar Java puede cerrar
sesiones. Si solo cambió React y el backend ya funciona:

```bat
docker compose up -d --build --no-deps web
```

Actualiza solo la web. Recarga con **Ctrl + F5**. Un simple `restart` no
incorpora código nuevo.

### Configuración inicial, solo si falta

```bat
if not exist .env copy .env.example .env
notepad .env
docker compose config --quiet
```

No sobrescribe un .env existente. Configura POSTGRES_PASSWORD, guarda y cierra
el Bloc de notas. El último comando valida sin imprimir secretos. No compartas
.env. Cambiar su contraseña no actualiza la contraseña de una base ya creada.

## 3. Comprobar y depurar

Desde la raíz:

```bat
docker compose ps
curl.exe --fail http://localhost/healthz
curl.exe --fail http://localhost/api/health
docker compose logs --tail=100 backend
docker compose logs --tail=100 web
docker compose logs --tail=100 database
```

Los curl comprueban web y API; ajusta el puerto si no usas el 80. Los logs
muestran los últimos 100 mensajes de cada servicio sin modificar datos.
Para seguir el backend en vivo:

```bat
docker compose logs -f --tail=100 backend
```

Ctrl + C deja de mostrar logs; los contenedores siguen funcionando.

| Error | Comprobación |
| --- | --- |
| dockerDesktopLinuxEngine no disponible | Abre Docker Desktop y ejecuta docker info. |
| Backend unhealthy o HTTP 502 | Revisa ps y logs de backend y database. |
| Vite ECONNREFUSED en /api | Inicia Java local en el puerto 8080. |
| HTTP 401 | Comprueba sesión y credenciales. |
| Puerto ocupado | Evita iniciar dos servidores en el mismo puerto. |

## 4. Detener sin perder datos

```bat
docker compose stop
```

Detiene conservando contenedores y volúmenes. Para volver, usa `docker compose up -d`.
Para retirar contenedores y red conservando datos:

```bat
docker compose down
```

**No añadas -v**: borraría los volúmenes de PostgreSQL y fotos. No borres
volúmenes para resolver errores de arranque.

## 5. Desarrollo: Java y React por separado

Necesitas Java 21, Maven y Node.js compatibles con el proyecto. Comprueba:

```bat
java -version
mvn.cmd -version
node --version
npm.cmd --version
```

Este modo usa **H2 local**, no PostgreSQL de Docker: sus datos pueden diferir.

### Terminal 1: backend

```bat
cd /d C:\Users\Willy\Documents\flujo\backend
mvn.cmd spring-boot:run -Dspring-boot.run.profiles=dev
```

Compila y arranca Spring Boot en **http://localhost:8080**. Deja la terminal
abierta. Flyway aplica migraciones pendientes automáticamente. H2 se guarda
en backend/data: no borres esa carpeta.

### Terminal 2: frontend

```bat
cd /d C:\Users\Willy\Documents\flujo\frontend
npm.cmd ci
npm.cmd run dev
```

`ci` instala dependencias fijadas en el archivo de versiones; úsalo al preparar
el proyecto o cambiar dependencias, no en cada arranque. Reemplaza node_modules,
no datos de negocio. `run dev` inicia Vite con recarga automática.
Abre la URL impresa, normalmente **http://localhost:5173**; si está ocupado,
puede ser 5174. Vite envía /api al backend en 8080.
No confundas esta web con Docker en el puerto 80. Detén ambas terminales con Ctrl + C.

## 6. Pruebas y compilación

Backend, ejecuta el comando que necesites:

```bat
cd /d C:\Users\Willy\Documents\flujo\backend
mvn.cmd test
mvn.cmd clean package
```

`test` ejecuta pruebas. `clean package` limpia la compilación anterior,
compila, prueba y genera el JAR en target; no borra la base de datos.

Frontend:

```bat
cd /d C:\Users\Willy\Documents\flujo\frontend
npm.cmd run build
```

Comprueba TypeScript y genera dist. No inicia un servidor ni actualiza Docker;
para publicar allí, usa el apartado 2.

## 7. Consultar tablas y migraciones

Desde la raíz, con Docker activo y usuario/base predeterminados:

```bat
docker compose exec database psql -U buenplato -d buenplato
```

Si configuraste otros nombres, sustitúyelos. Dentro de psql:

```sql
\dt
SELECT installed_rank, version, description, success
FROM flyway_schema_history ORDER BY installed_rank;
\q
```

Lista tablas, consulta migraciones y sale. Flyway migra al iniciar Java:
no vuelvas a ejecutar manualmente sus SQL ni cambies migraciones ya aplicadas.

Solo en modo dev: **http://localhost:8080/h2-console**.

- JDBC URL: `jdbc:h2:file:./data/buenplato;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH`
- Usuario: sa; contraseña vacía según la configuración actual de desarrollo.

H2 no muestra los datos PostgreSQL de Docker. Las cuentas de acceso a la
aplicación están en CUENTAS_LOCALES.md; no son las de la base de datos.

## Recordatorio diario

Abre Docker Desktop, entra a la raíz en CMD y ejecuta `docker compose up -d`.
Después abre **http://localhost/**. Si cambió el código, añade `--build`.
