import Link from "next/link";
import { Hourglass } from "lucide-react";

// Estado de espera para los bloques que necesitan información que el Excel
// nunca guardó (qué producto se vendió, con qué método se pagó). Se dice qué
// falta y por dónde empieza a llenarse, en vez de mostrar cifras inventadas o
// un cero que se leería como "no vendiste nada".
export default function WaitingForData({
  title,
  detail,
  cta,
  href = "/sales",
  compact,
}) {
  return (
    <div
      className={`rounded-[10px] border border-dashed border-slate-200 bg-slate-50 text-center ${
        compact ? "px-3 py-5" : "px-4 py-9"
      }`}
    >
      <Hourglass
        className={`mx-auto text-slate-300 ${compact ? "h-5 w-5" : "h-7 w-7"}`}
      />
      <div
        className={`mt-2 font-bold text-slate-700 ${compact ? "text-[13.5px]" : "text-[15px]"}`}
      >
        {title}
      </div>
      <p
        className={`mx-auto mt-1 max-w-md text-slate-500 ${compact ? "text-[12.5px]" : "text-[13.5px]"}`}
      >
        {detail}
      </p>
      {cta && (
        <Link
          href={href}
          className="mt-3 inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-bold text-slate-700 transition-colors hover:bg-slate-50"
        >
          {cta}
        </Link>
      )}
    </div>
  );
}
