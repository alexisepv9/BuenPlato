/** Comprueba que la configuración Axios conserva FormData y no convierte la foto en JSON. */
import assert from "node:assert/strict";
import axios from "../frontend/node_modules/axios/index.js";

const client = axios.create({ headers: { "Content-Type": "application/json" } });
const data = new FormData();
data.append("file", new Blob(["photo-test"], { type: "image/png" }), "photo.png");
await client.post("/photo-test", data, {
  headers: { "Content-Type": null },
  adapter: async config => {
    assert.ok(config.data instanceof FormData, "La imagen no debe serializarse como JSON");
    assert.equal(config.data.get("file").name, "photo.png");
    assert.notEqual(config.headers.get("Content-Type"), "application/json");
    return { status: 200, statusText: "OK", headers: {}, config, data: {} };
  },
});
console.log("Carga de fotos: FormData y cabeceras correctos.");
