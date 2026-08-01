"use client";

import {
  Download,
  PlusCircle,
  Printer,
  RefreshCw,
  ScanLine,
  Smartphone,
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
  phoneScanAvailable = false,
  phoneConnected = false,
  onPhoneScan,
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
        {/* Los dos escaneos comparten celda: son la misma familia -traer un
            producto por su código- y solo cambia con qué se lee. El del celular
            queda como ícono para no robarle sitio al de siempre ni añadir una
            séptima columna. */}
        <div className="flex gap-1.5">
          <button
            onClick={onScan}
            className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <ScanLine className="h-4 w-4 shrink-0" />
            <span className="truncate">Escanear código</span>
          </button>

          {phoneScanAvailable && (
            <button
              onClick={onPhoneScan}
              aria-label={
                phoneConnected
                  ? "Escanear con el celular (hay uno conectado)"
                  : "Escanear con el celular"
              }
              title={
                phoneConnected
                  ? "Celular conectado: ya puedes escanear con él"
                  : "Escanear con el celular"
              }
              className="relative flex w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Smartphone className="h-4 w-4" />
              {phoneConnected && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
              )}
            </button>
          )}
        </div>
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
