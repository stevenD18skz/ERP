// Gastos del negocio y movimientos de caja (entradas y salidas).

import { collection, commit, isSimulationOn } from "../lib/dataSource";
import { apiFetch, apiFetchAll } from "../lib/api/client";

const all = () => collection("expenses");

const sameId = (a, b) => String(a) === String(b);

export const getExpenses = async () => {
  if (isSimulationOn()) return [...all()];
  return apiFetchAll("/api/expenses");
};

export const getExpenseById = async (id) => {
  if (isSimulationOn()) {
    const expense = all().find((e) => sameId(e.id, id));
    if (!expense) throw new Error("Expense not found");
    return expense;
  }
  const { data } = await apiFetch(`/api/expenses/${id}`);
  return data;
};

export const createExpense = async (expense) => {
  if (isSimulationOn()) {
    const created = {
      id: `x${Date.now()}`,
      kind: "gasto",
      concept: "",
      notes: "",
      ...expense,
    };
    all().unshift(created);
    commit("expenses");
    return created;
  }
  const { data } = await apiFetch("/api/expenses", {
    method: "POST",
    body: JSON.stringify(expense),
  });
  return data;
};

export const updateExpense = async (id, changes) => {
  if (isSimulationOn()) {
    const expense = all().find((e) => sameId(e.id, id));
    if (!expense) throw new Error("Expense not found");
    Object.assign(expense, changes);
    commit("expenses");
    return expense;
  }
  const { data } = await apiFetch(`/api/expenses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
  return data;
};

export const deleteExpense = async (id) => {
  if (isSimulationOn()) {
    const expenses = all();
    const index = expenses.findIndex((e) => sameId(e.id, id));
    if (index === -1) throw new Error("Expense not found");
    expenses.splice(index, 1);
    commit("expenses");
    return { message: "Expense deleted" };
  }
  await apiFetch(`/api/expenses/${id}`, { method: "DELETE" });
  return { message: "Expense deleted" };
};
