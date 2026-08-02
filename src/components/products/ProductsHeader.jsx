"use client";

import {
  Download,
  PlusCircle,
  Printer,
  RefreshCw,
  ScanLine,
  Upload,
} from "lucide-react";

const ACTION_CLASS =
  "flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60";

// Título + fila de acciones del catálogo. Exportar e imprimir se apagan cuando
// no hay nada filtrado en pantalla: trabajan sobre lo que se está viendo, no
// sobre todo el catálogo.
export default function ProductsHeader({
  loading,
  canExport,
  onRefresh,
  onImport,
  onExportCSV,
  onExportPDF,
  onScan,
  onNew,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="mb-1 text-2xl font-bold tracking-tight text-slate-900">
        Tabla con todos los productos
      </h2>


      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
        <button onClick={onRefresh} disabled={loading} className={ACTION_CLASS}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
        <button onClick={onImport} className={ACTION_CLASS}>
          <Upload className="h-4 w-4" />
          Importar
        </button>
        <button
          onClick={onExportCSV}
          disabled={!canExport}
          className={ACTION_CLASS}
        >
          <Download className="h-4 w-4" />
          Exportar
        </button>
        <button
          onClick={onExportPDF}
          disabled={!canExport}
          className={ACTION_CLASS}
        >
          <Printer className="h-4 w-4" />
          Imprimir
        </button>
        {/* El escaneo con el celular vive aparte, como botón flotante
            (ver PhoneScannerFab): es un atajo de emparejar-una-vez y no una
            acción del día a día como esta. */}
        <button
          onClick={onScan}
          className="flex min-w-0 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ScanLine className="h-4 w-4 shrink-0" />
          <span className="truncate">Escanear código</span>
        </button>
        <button
          onClick={onNew}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <PlusCircle className="h-4 w-4" />
          Nuevo producto
        </button>
      </div>
    </div>
  );
}
