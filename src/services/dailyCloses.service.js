import { dailyCloses } from "../lib/mockDb";

export const getDailyCloses = async () => {
  try {
    const response = dailyCloses;
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Error fetching daily closes");
  }
};

export const getDailyCloseByDate = async (date) => {
  try {
    const response = dailyCloses.find((close) => close.date === date);
    if (!response) {
      throw new Error("Daily close not found");
    }
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Error fetching daily close");
  }
};

export const createDailyClose = async (close) => {
  try {
    if (dailyCloses.some((item) => item.date === close.date)) {
      throw new Error("Ya existe un cierre para esa fecha");
    }
    dailyCloses.unshift({
      id: `dc-${close.date}`,
      cash_in: null,
      cash_out: null,
      source: "app",
      ...close,
    });
    dailyCloses.sort((a, b) => b.date.localeCompare(a.date));
    return { message: "Daily close created" };
  } catch (error) {
    throw new Error(error.message || "Error creating daily close");
  }
};

export const updateDailyClose = async (id, close) => {
  try {
    const response = dailyCloses.find((item) => item.id === id);
    if (!response) {
      throw new Error("Daily close not found");
    }
    Object.assign(response, close);
    return response;
  } catch (error) {
    throw new Error(error.message || "Error updating daily close");
  }
};

export const deleteDailyClose = async (id) => {
  try {
    const response = dailyCloses.find((item) => item.id === id);
    if (!response) {
      throw new Error("Daily close not found");
    }
    dailyCloses.splice(dailyCloses.indexOf(response), 1);
    return { message: "Daily close deleted" };
  } catch (error) {
    throw new Error(error.message || "Error deleting daily close");
  }
};
