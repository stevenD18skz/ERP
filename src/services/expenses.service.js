import { expenses } from "../lib/mockDb";

export const getExpenses = async () => {
  try {
    const response = expenses;
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Error fetching expenses");
  }
};

export const getExpenseById = async (id) => {
  try {
    const response = expenses.find((expense) => expense.id === id);
    if (!response) {
      throw new Error("Expense not found");
    }
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Error fetching expense");
  }
};

export const createExpense = async (expense) => {
  try {
    expenses.unshift({
      id: `x${Date.now()}`,
      kind: "gasto",
      concept: "",
      notes: "",
      ...expense,
    });
    return { message: "Expense created" };
  } catch (error) {
    throw new Error(error.response?.data?.error || "Error creating expense");
  }
};

export const updateExpense = async (id, expense) => {
  try {
    const response = expenses.find((item) => item.id === id);
    if (!response) {
      throw new Error("Expense not found");
    }
    Object.assign(response, expense);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Error updating expense");
  }
};

export const deleteExpense = async (id) => {
  try {
    const response = expenses.find((item) => item.id === id);
    if (!response) {
      throw new Error("Expense not found");
    }
    expenses.splice(expenses.indexOf(response), 1);
    return { message: "Expense deleted" };
  } catch (error) {
    throw new Error(error.response?.data?.error || "Error deleting expense");
  }
};
