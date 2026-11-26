#!/bin/sh
# Render entrega DATABASE_URL como postgresql://usuario:clave@host:puerto/base,
# pero Spring Boot espera jdbc:postgresql://host:puerto/base.
# En Docker local la URL ya viene en formato JDBC y se deja intacta.
set -eu

case "${DATABASE_URL:-}" in
  postgres://*|postgresql://*)
    host_and_database="${DATABASE_URL#*://}"
    # Quita las credenciales; usuario y clave llegan por POSTGRES_USER/POSTGRES_PASSWORD.
    host_and_database="${host_and_database##*@}"
    export DATABASE_URL="jdbc:postgresql://${host_and_database}"
    ;;
esac

exec java -jar /app/backend.jar
