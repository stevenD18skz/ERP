// Cierre diario: un día completo del negocio en una sola fila, que es como
// venía la contabilidad en el Excel. Solo puede haber un cierre por fecha.

import { collection, commit, isSimulationOn } from "../lib/dataSource";
import { apiFetch, apiFetchAll } from "../lib/api/client";

const all = () => collection("dailyCloses");

const sameId = (a, b) => String(a) === String(b);

export const getDailyCloses = async () => {
  if (isSimulationOn()) return [...all()];
  return apiFetchAll("/api/daily-closes");
};

// /api/daily-closes/:id acepta el id o directamente la fecha (AAAA-MM-DD).
export const getDailyCloseByDate = async (date) => {
  if (isSimulationOn()) {
    const close = all().find((c) => c.date === date);
    if (!close) throw new Error("Daily close not found");
    return close;
  }
  const { data } = await apiFetch(`/api/daily-closes/${date}`);
  return data;
};

export const createDailyClose = async (close) => {
  if (isSimulationOn()) {
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
  }

  const { data } = await apiFetch("/api/daily-closes", {
    method: "POST",
    body: JSON.stringify(close),
  });
  return data;
};

export const updateDailyClose = async (id, changes) => {
  if (isSimulationOn()) {
    const close = all().find((c) => sameId(c.id, id));
    if (!close) throw new Error("Daily close not found");
    Object.assign(close, changes);
    commit("dailyCloses");
    return close;
  }
  const { data } = await apiFetch(`/api/daily-closes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
  return data;
};

export const deleteDailyClose = async (id) => {
  if (isSimulationOn()) {
    const closes = all();
    const index = closes.findIndex((c) => sameId(c.id, id));
    if (index === -1) throw new Error("Daily close not found");
    closes.splice(index, 1);
    commit("dailyCloses");
    return { message: "Daily close deleted" };
  }
  await apiFetch(`/api/daily-closes/${id}`, { method: "DELETE" });
  return { message: "Daily close deleted" };
};
