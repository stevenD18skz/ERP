// Identificador corto para cosas que solo viven en memoria: la clave de una
// línea del carrito, el id de un toast, el id provisional de un producto recién
// creado mientras el servicio responde.
//
// No sirve como identificador definitivo de base de datos: son 7 caracteres al
// azar, sin garantía real de unicidad global.
export const uid = () => Math.random().toString(36).slice(2, 9);

export default uid;
