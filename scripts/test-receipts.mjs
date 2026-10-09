/** Prueba las plantillas sin navegador ni impresora: contenido, privacidad y escape HTML. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "../frontend/node_modules/typescript/lib/typescript.js";

const source = readFileSync(new URL("../frontend/src/features/sales/printOrder.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const exports = {};
vm.runInNewContext(compiled.outputText, { exports, require: path => {
  if (path.endsWith("presentation")) return { currency: new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }) };
  if (path.endsWith("api")) return {};
  throw new Error(`Import no esperado: ${path}`);
} });
const sale = { id: 1, revision: 1, orderNumber: "BP-TEST", customerName: "<script>alert(1)</script>",
  serviceType: "TAKEAWAY", paymentMethod: "CASH", total: 6900, createdAt: "2026-10-08T13:00:00-03:00",
  notes: "Sin sal\nSalsa aparte", items: [{ itemType: "MENU", itemName: "Buffet", quantity: 1,
    unitPrice: 6900, totalPrice: 6900, selections: [{ name: "Pollo", totalQuantity: 1 }] }] };
const client = exports.receiptHtml(sale, "customer", false);
const kitchen = exports.receiptHtml(sale, "kitchen", true);
assert.ok(client.includes("NO VÁLIDO COMO BOLETA TRIBUTARIA"));
assert.ok(client.includes("6.900"));
assert.ok(!kitchen.includes("6.900"));
assert.ok(!kitchen.includes("Efectivo"));
assert.ok(kitchen.includes("1 × Pollo"));
assert.ok(kitchen.includes("Sin sal\nSalsa aparte"));
assert.ok(kitchen.includes("REIMPRESIÓN / COPIA"));
assert.ok(kitchen.includes("PEDIDO MODIFICADO"));
assert.ok(!client.includes("<script>"));
assert.ok(client.includes("&lt;script&gt;"));
assert.ok(client.includes("width:80mm"));
console.log("Plantillas cliente/cocina: comprobaciones correctas.");
