// Nombre de la cookie que le avisa a middleware.ts que la pestaña tiene la
// simulación encendida, para no pedirle login a algo que nunca toca la tienda
// real. Vive aparte de store.ts para que middleware (Edge) no tenga que
// cargar todo el generador de datos de ejemplo solo por esta constante.
export const SIM_COOKIE = "erp_sim";
