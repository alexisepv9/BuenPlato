/** Regresiones de mensajes: HTML del proxy, sesión, validaciones y guardados inciertos. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requestErrorMessage } from '../src/lib/requestError.ts';

test('502 nunca imprime el documento HTML recibido', () => {
  const message = requestErrorMessage(502, '<!DOCTYPE html><style>base64,secreto</style>', '/auth/login', undefined, 'ref-123', 'POST');
  assert.match(message, /502/);
  assert.match(message, /ref-123/);
  assert.doesNotMatch(message, /DOCTYPE|base64|secreto|contraseña incorrecta/);
});
test('401 distingue login de sesión vencida', () => {
  assert.match(requestErrorMessage(401, {}, '/auth/login'), /Correo o contraseña incorrectos/);
  assert.match(requestErrorMessage(401, {}, '/products'), /sesión venció/);
});
test('respeta validaciones de negocio, oculta trazas del servidor', () => {
  assert.match(requestErrorMessage(400, {message:'Selecciona una paleta disponible.'}, '/branding'), /Selecciona una paleta/);
  assert.doesNotMatch(requestErrorMessage(500, {message:'SQL secret'}, '/products'), /SQL secret/);
});
test('advierte sobre posibles duplicados sin reintentar un POST automáticamente', () => {
  assert.match(requestErrorMessage(undefined, null, '/products/configuration', 'ECONNABORTED', 'ref-1', 'POST'), /evitar duplicados/);
});
