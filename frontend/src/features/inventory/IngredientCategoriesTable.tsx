/** Tabla de categorías: DataTables administra búsqueda, orden y paginación; React, las acciones. */
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import "datatables.net-dt/css/dataTables.dataTables.css";

DataTable.use(DT);
type Category = { id: number; name: string };

/** Recibe datos confirmados por la API; no duplica el estado del catálogo. */
export function IngredientCategoriesTable({ categories, busy, onEdit, onDeactivate }: {
  categories: Category[];
  busy: boolean;
  onEdit: (category: Category) => void;
  onDeactivate: (category: Category) => void;
}) {
  return <div className="overflow-x-auto rounded-xl border border-border p-3 text-sm">
    <DataTable data={categories} className="display w-full" columns={[
      { data: "name", title: "Categoría", render: DT.render.text() },
      { data: null, title: "Acciones", orderable: false, searchable: false },
    ]} options={{
      pageLength: 5, lengthMenu: [5, 10, 25], order: [[0, "asc"]],
      language: {
        search: "Buscar:", searchPlaceholder: "Nombre de categoría",
        lengthMenu: "Mostrar _MENU_", info: "_START_–_END_ de _TOTAL_ categorías",
        infoEmpty: "Sin categorías", infoFiltered: "(de _MAX_ en total)",
        emptyTable: "Todavía no hay categorías.", zeroRecords: "No hay categorías que coincidan.",
        paginate: { first: "Primera", last: "Última", next: "Siguiente", previous: "Anterior" },
      },
    }} slots={{
      1: (_data: unknown, row: Category) => <div className="flex flex-wrap gap-1">
        <button type="button" disabled={busy} aria-label={`Editar ${row.name}`} onClick={() => onEdit(row)} className="min-h-11 rounded-lg px-2 font-semibold text-brand disabled:opacity-50">Editar</button>
        {row.id !== 1 ? <button type="button" disabled={busy} aria-label={`Desactivar ${row.name}`} onClick={() => onDeactivate(row)} className="min-h-11 rounded-lg px-2 text-red-700 disabled:opacity-50">Desactivar</button> : <span className="self-center px-2 text-xs text-muted">Predeterminada</span>}
      </div>,
    }} />
  </div>;
}
