// Cierre diario: un día completo del negocio en una sola fila, que es como
// venía la contabilidad en el Excel. Solo puede haber un cierre por fecha.

import { collection, commit } from "../lib/dataSource";

const all = () => collection("dailyCloses");

const sameId = (a, b) => String(a) === String(b);

export const getDailyCloses = async () => [...all()];

export const getDailyCloseByDate = async (date) => {
  const close = all().find((c) => c.date === date);
  if (!close) throw new Error("Daily close not found");
  return close;
};

export const createDailyClose = async (close) => {
  const closes = all();
  if (closes.some((item) => item.date === close.date)) {
    throw new Error("Ya existe un cierre para esa fecha");
  }

  const created = {
    id: `dc-${close.date}`,
    cash_in: null,
    cash_out: null,
    source: "app",
    ...close,
  };

  closes.unshift(created);
  closes.sort((a, b) => b.date.localeCompare(a.date));
  commit("dailyCloses");
  return created;
};

export const updateDailyClose = async (id, changes) => {
  const close = all().find((c) => sameId(c.id, id));
  if (!close) throw new Error("Daily close not found");
  Object.assign(close, changes);
  commit("dailyCloses");
  return close;
};

export const deleteDailyClose = async (id) => {
  const closes = all();
  const index = closes.findIndex((c) => sameId(c.id, id));
  if (index === -1) throw new Error("Daily close not found");
  closes.splice(index, 1);
  commit("dailyCloses");
  return { message: "Daily close deleted" };
};
