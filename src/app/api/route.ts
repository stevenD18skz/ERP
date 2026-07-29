// GET /api
// Índice de la API: qué endpoints hay y para qué sirve cada uno.
// La documentación completa, con parámetros y ejemplos, está en docs/API.md.

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    data: {
      nombre: "Boxes · API",
      documentacion: "docs/API.md",
      formato: {
        exito: '{ "data": ..., "meta": { ... } }',
        error:
          '{ "error": { "message": "...", "code": "...", "details": ... } }',
      },
      endpoints: {
        "GET    /api/health":
          "estado de la conexión con Supabase y de los datos",
        "GET    /api/summary": "indicadores del negocio en un rango de fechas",

        "GET    /api/products": "catálogo, con búsqueda, filtros y páginas",
        "POST   /api/products": "crea un producto",
        "GET    /api/products/categories": "categorías con su conteo",
        "GET    /api/products/brands": "marcas con su conteo",
        "GET    /api/products/:id": "un producto",
        "PATCH  /api/products/:id": "actualiza un producto",
        "DELETE /api/products/:id": "borra un producto",

        "GET    /api/sales": "ventas con sus líneas",
        "POST   /api/sales": "registra una venta y descuenta el inventario",
        "GET    /api/sales/:id": "una venta",
        "PATCH  /api/sales/:id": "anula una venta o corrige el encabezado",
        "DELETE /api/sales/:id": "borra una venta",

        "GET    /api/orders": "pedidos a proveedores",
        "POST   /api/orders": "crea un pedido",
        "GET    /api/orders/:id": "un pedido",
        "PATCH  /api/orders/:id": "cambia estado o datos del pedido",
        "DELETE /api/orders/:id": "borra un pedido",
        "POST   /api/orders/:id/receive":
          "recibe el pedido y suma el inventario",

        "GET    /api/expenses": "gastos y movimientos de caja",
        "POST   /api/expenses": "registra un gasto o movimiento",
        "GET    /api/expenses/:id": "un gasto",
        "PATCH  /api/expenses/:id": "actualiza un gasto",
        "DELETE /api/expenses/:id": "borra un gasto",

        "GET    /api/daily-closes": "cierres diarios",
        "POST   /api/daily-closes": "cierra un día",
        "GET    /api/daily-closes/:id":
          "un cierre (acepta id o fecha AAAA-MM-DD)",
        "PATCH  /api/daily-closes/:id": "corrige un cierre",
        "DELETE /api/daily-closes/:id": "borra un cierre",
      },
    },
  });
}
