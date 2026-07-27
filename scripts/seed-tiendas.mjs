// Uso único: crea las tiendas iniciales y les asigna los datos que ya existen
// en la base (todos son de Jose's Market; The Sunny Go arranca vacía).
//
// node scripts/seed-tiendas.mjs
//
// Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local.
// El hash de password usa el mismo formato que src/lib/auth/password.ts
// (scrypt, "salt:hash" en hex) para que el login pueda verificarlo después.

import fs from "node:fs";
import path from "node:path";
import { scryptSync, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const file = path.join(process.cwd(), ".env.local");
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const TIENDAS = [
  { nombre: "Jose's Market", dueno: "Jose", password: "Jing-2004" },
  { nombre: "The Sunny Go", dueno: "Steven", password: "The1-piece" },
];

const TABLES_TO_BACKFILL = [
  "products",
  "sales",
  "orders",
  "expenses",
  "daily_closes",
];

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local",
    );
  }

  const db = createClient(url, key, { auth: { persistSession: false } });

  const ids = {};
  for (const t of TIENDAS) {
    const { data: existing, error: findError } = await db
      .from("tiendas")
      .select("id")
      .ilike("nombre", t.nombre)
      .maybeSingle();
    if (findError) throw findError;

    if (existing) {
      console.log(`Ya existía: ${t.nombre} (${existing.id})`);
      ids[t.nombre] = existing.id;
      continue;
    }

    const { data: created, error: insertError } = await db
      .from("tiendas")
      .insert({
        nombre: t.nombre,
        dueno: t.dueno,
        password_hash: hashPassword(t.password),
      })
      .select("id")
      .single();
    if (insertError) throw insertError;

    console.log(`Creada: ${t.nombre} (${created.id})`);
    ids[t.nombre] = created.id;
  }

  const joseMarketId = ids["Jose's Market"];
  for (const table of TABLES_TO_BACKFILL) {
    const { error, count } = await db
      .from(table)
      .update({ tienda_id: joseMarketId }, { count: "exact" })
      .is("tienda_id", null);
    if (error) throw error;
    console.log(`${table}: ${count ?? "?"} filas asignadas a Jose's Market`);
  }

  console.log("\nListo. The Sunny Go queda vacía a propósito.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
