// POST /api/auth/logout   borra la cookie de sesión

import { handle, ok } from "@/lib/api/http";
import { SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return handle(async () => {
    const res = ok({ loggedOut: true });
    res.cookies.delete(SESSION_COOKIE);
    return res;
  });
}
