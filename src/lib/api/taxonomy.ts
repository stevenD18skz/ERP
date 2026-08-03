// Categorías y marcas: resolver el nombre que llega del formulario al id que
// guarda el producto, creándolo si todavía no existe.
//
// Las dos tablas tienen exactamente la misma forma (id, tienda_id, name), así
// que las dos se atienden con el mismo código y solo cambia el nombre de la
// tabla y cómo se llama la cosa cuando hay que explicar un error.
//
// El formulario manda las dos cosas: el id cuando se eligió algo de la lista, y
// siempre el nombre. Al escribir una categoría que no está y darle a "Crear",
// el id viaja en null y el nombre trae lo que se escribió; ahí es donde esto
// crea la fila. Así, "agregar el producto" y "agregar su categoría nueva" son
// una sola acción para quien registra, que es como se pidió.

import type { SupabaseClient } from "@supabase/supabase-js";

import { fromPostgrest, badRequest, notFound } from "./errors";
import type { ProductRow } from "@/types/database";

export type TaxonomyKind = "categories" | "brands";

const LABELS: Record<TaxonomyKind, string> = {
  categories: "la categoría",
  brands: "la marca",
};

// La vista con el conteo de productos (ver 01_schema.sql) y la columna que en
// ella identifica la fila: mismo par que usan las rutas GET de listado.
const COUNT_VIEWS: Record<TaxonomyKind, string> = {
  categories: "v_product_categories",
  brands: "v_product_brands",
};
const COUNT_ID_COLUMNS: Record<TaxonomyKind, string> = {
  categories: "category_id",
  brands: "brand_id",
};

// La misma comparación que hace el índice único de Postgres
// (lower(btrim(name))): si acá se normalizara distinto —quitando tildes, por
// ejemplo— el código creería que "Lacteos" es nueva y la base la rechazaría por
// repetida, o al revés.
const key = (name: string): string => name.trim().toLowerCase();

type Db = SupabaseClient;

/** Lo que puede mandar el cliente para una de estas dos columnas. */
export type TaxonomyInput = {
  /** Id de algo que ya existe. undefined = no vino; null = se quiere quitar. */
  id?: string | null;
  /** Nombre escrito. Si no coincide con nada, se crea. */
  name?: string | null;
};

/**
 * Devuelve el id que hay que guardar:
 *   string    -> esta categoría/marca (existía o se acaba de crear)
 *   null      -> quitarla
 *   undefined -> no se mandó nada, no tocar la columna (para el PATCH)
 */
export async function resolveTaxonomyId(
  db: Db,
  kind: TaxonomyKind,
  tiendaId: string,
  input: TaxonomyInput,
): Promise<string | null | undefined> {
  const { id, name } = input;

  // El id manda cuando se eligió de la lista: es lo único que no depende de
  // cómo esté escrito el nombre.
  if (typeof id === "string" && id) {
    const { data, error } = await db
      .from(kind)
      .select("id")
      .eq("id", id)
      .eq("tienda_id", tiendaId)
      .maybeSingle();
    if (error) throw fromPostgrest(error, `la consulta de ${LABELS[kind]}`);
    if (!data) {
      throw badRequest(
        `No existe ${LABELS[kind]} que se eligió. Puede que alguien la haya borrado; vuelve a elegirla.`,
      );
    }
    return data.id as string;
  }

  // Sin id pero con nombre: se busca por nombre y, si no está, se crea. Este es
  // el camino del botón "Crear «maizena»".
  if (name !== undefined) {
    const wanted = (name ?? "").trim();
    if (!wanted) return null;
    return findOrCreate(db, kind, tiendaId, wanted);
  }

  // Vino el id explícitamente en null y ningún nombre: se quiere dejar vacío.
  if (id === null) return null;

  return undefined;
}

async function findOrCreate(
  db: Db,
  kind: TaxonomyKind,
  tiendaId: string,
  name: string,
): Promise<string> {
  // Se traen todas las de la tienda y se compara acá. Son unas pocas decenas, y
  // es la única forma de comparar igual que el índice: PostgREST no sabe
  // filtrar por lower(btrim(name)), e ilike trataría el % de un nombre como
  // comodín.
  const existing = await listTaxonomy(db, kind, tiendaId);
  const match = existing.find((row) => key(row.name) === key(name));
  if (match) return match.id;

  const { data, error } = await db
    .from(kind)
    .insert({ tienda_id: tiendaId, name })
    .select("id")
    .single();

  if (error) {
    // Dos productos guardados al mismo tiempo con la misma categoría nueva: uno
    // la creó entre el select y el insert del otro. No es un error para quien
    // registra, es exactamente la fila que quería.
    if (error.code === "23505") {
      const again = await listTaxonomy(db, kind, tiendaId);
      const found = again.find((row) => key(row.name) === key(name));
      if (found) return found.id;
    }
    throw fromPostgrest(error, `la creación de ${LABELS[kind]}`);
  }

  return data.id as string;
}

async function listTaxonomy(
  db: Db,
  kind: TaxonomyKind,
  tiendaId: string,
): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await db
    .from(kind)
    .select("id, name")
    .eq("tienda_id", tiendaId);
  if (error) throw fromPostgrest(error, `el listado de ${LABELS[kind]}`);
  return (data ?? []) as Array<{ id: string; name: string }>;
}

/**
 * Cambia el nombre de una categoría o marca existente. No toca los productos
 * que la usan: como el id no cambia, la próxima vez que se lean (v_products,
 * o esta misma respuesta) van a traer el nombre nuevo solos.
 *
 * Devuelve la fila tal como la arma la vista de listado (con product_count),
 * para que quien llama pueda actualizar su caché sin pedir la lista entera de
 * nuevo.
 */
export async function renameTaxonomy(
  db: Db,
  kind: TaxonomyKind,
  tiendaId: string,
  id: string,
  name: string,
): Promise<Record<string, unknown>> {
  const { error: updateError } = await db
    .from(kind)
    .update({ name })
    .eq("id", id)
    .eq("tienda_id", tiendaId);
  if (updateError) {
    throw fromPostgrest(updateError, `el cambio de nombre de ${LABELS[kind]}`);
  }

  const { data, error } = await db
    .from(COUNT_VIEWS[kind])
    .select("*")
    .eq(COUNT_ID_COLUMNS[kind], id)
    .eq("tienda_id", tiendaId)
    .maybeSingle();
  if (error) throw fromPostgrest(error, `la consulta de ${LABELS[kind]}`);
  if (!data) {
    throw notFound(
      `No existe ${LABELS[kind]} que se quiere renombrar. Puede que alguien la haya borrado.`,
    );
  }
  return data;
}

/**
 * Lee un producto por id desde la vista v_products, que es la que trae el
 * nombre de la categoría y de la marca ya resueltos. Se usa después de crear o
 * actualizar: el insert sobre la tabla devuelve los ids, pero la pantalla
 * necesita los nombres.
 */
export async function readProductRow(
  db: Db,
  id: string,
  tiendaId: string,
): Promise<ProductRow | null> {
  const { data, error } = await db
    .from("v_products")
    .select("*")
    .eq("id", id)
    .eq("tienda_id", tiendaId)
    .maybeSingle();
  if (error) throw fromPostgrest(error, "la consulta del producto");
  return (data as ProductRow) ?? null;
}
