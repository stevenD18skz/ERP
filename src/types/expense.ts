// Gastos y movimientos de caja.
// El Excel guardaba el gasto como un único total por día (columna GASTO) y los
// movimientos de caja en las columnas DENTRADA y SALIDA, sin concepto asociado.

export type ExpenseKind = "gasto" | "entrada" | "salida";

export interface Expense {
  id: string;
  /** Fecha en formato YYYY-MM-DD. */
  date: string;
  /** "gasto" = salida por consumo del negocio; "entrada"/"salida" = movimiento de caja. */
  kind: ExpenseKind;
  amount: number;
  /** Descripción corta. El Excel no la traía: los registros importados quedan sin detallar. */
  concept: string;
  notes: string;
}

// Datos que arma el formulario de gastos antes de guardar.
export type NewExpense = Omit<Expense, "id"> & Partial<Pick<Expense, "id">>;
export type ExpenseUpdate = Partial<Omit<Expense, "id">>;
