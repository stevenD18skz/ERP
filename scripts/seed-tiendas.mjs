// Crea las tiendas de la base: las dos reales y una de demo. Se puede correr
// las veces que haga falta -si la tienda ya existe por nombre, no la toca de
// nuevo, así que no pisa una contraseña que ya esté en uso.
//
// node scripts/seed-tiendas.mjs
//
// Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local.
// El hash de password usa el mismo formato que src/lib/auth/password.ts
// (scrypt, "salt:hash" en hex) para que el login pueda verificarlo después.
// Va en Node y no en supabase/sql/*.sql justamente por eso: Postgres no trae
// scrypt.
//
// Después de correr esto, supabase/sql/10_seed_demo.sql le mete catálogo y
// ventas de ejemplo solo a la tienda de demo.

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
  {
    nombre: "Jose's Market",
    dueno: "Jose",
    email: "jing253436@gmail.com",
    password: "Jing-2004",
  },
  {
    nombre: "The Sunny Go",
    dueno: "Steven",
    email: "brayanss2018@gmail.com",
    password: "The1-piece",
  },
  // Tienda de demo: la única que supabase/sql/10_seed_demo.sql llena con
  // catálogo y ventas de ejemplo. Las otras dos arrancan vacías.
  {
    nombre: "Nikka",
    dueno: "Luffy",
    email: "nbrayan720@gmail.com",
    password: "Manchitas0905",
  },
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

  for (const t of TIENDAS) {
    const { data: existing, error: findError } = await db
      .from("tiendas")
      .select("id")
      .ilike("nombre", t.nombre)
      .maybeSingle();
    if (findError) throw findError;

    if (existing) {
      console.log(`Ya existía: ${t.nombre} (${existing.id})`);
      continue;
    }

    const { data: created, error: insertError } = await db
      .from("tiendas")
      .insert({
        nombre: t.nombre,
        dueno: t.dueno,
        email: t.email,
        password_hash: hashPassword(t.password),
      })
      .select("id")
      .single();
    if (insertError) throw insertError;

    console.log(`Creada: ${t.nombre} (${created.id})`);
  }

  console.log(
    "\nListo. Corre supabase/sql/10_seed_demo.sql para llenar la tienda de demo con catálogo y ventas de ejemplo.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
