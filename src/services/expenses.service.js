// Gastos del negocio y movimientos de caja (entradas y salidas).

import { collection, commit } from "../lib/dataSource";

const all = () => collection("expenses");

const sameId = (a, b) => String(a) === String(b);

export const getExpenses = async () => [...all()];

export const getExpenseById = async (id) => {
  const expense = all().find((e) => sameId(e.id, id));
  if (!expense) throw new Error("Expense not found");
  return expense;
};

export const createExpense = async (expense) => {
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
};

export const updateExpense = async (id, changes) => {
  const expense = all().find((e) => sameId(e.id, id));
  if (!expense) throw new Error("Expense not found");
  Object.assign(expense, changes);
  commit("expenses");
  return expense;
};

export const deleteExpense = async (id) => {
  const expenses = all();
  const index = expenses.findIndex((e) => sameId(e.id, id));
  if (index === -1) throw new Error("Expense not found");
  expenses.splice(index, 1);
  commit("expenses");
  return { message: "Expense deleted" };
};
