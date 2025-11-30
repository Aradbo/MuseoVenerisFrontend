// components/CardExposicion.tsx
import Link from "next/link";

type CardExposicionProps = {
  exposicion: {
    idExposicion: number;
    nombre?: string | null;
    descripcion?: string | null;
    estado?: string | null;
    urls?: string | null;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
    sala?: string | null;
  };
};

function getFirstImage(urls: string | null | undefined): string | null {
  if (!urls) return null;
  const parts = urls
    .split(/[;,|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts[0] || null;
}

export default function CardExposicion({ exposicion }: CardExposicionProps) {
  const img = getFirstImage(exposicion.urls ?? null);
  const estado = (exposicion.estado || "").toLowerCase();
  const esActiva = estado.startsWith("a"); // Activa / Activo / etc.

  return (
    <Link
      href={`/exposiciones/${exposicion.idExposicion}`}
      className="group block h-full"
      prefetch
    >
      <article className="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden border border-slate-100 flex flex-col h-full">
        {/* Imagen */}
        <div className="bg-slate-50 aspect-[4/3] overflow-hidden">
          {img ? (
            <img
              src={img}
              alt={exposicion.nombre ?? "Exposición"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#fdf3d1] via-[#f5e6c8] to-[#f4f2ee]">
              <span className="text-4xl opacity-40">🖼️</span>
            </div>
          )}
        </div>

        {/* Texto */}
        <div className="p-5 flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-[#CBA135] transition-colors line-clamp-2">
            {exposicion.nombre}
          </h3>

          {exposicion.descripcion && (
            <p className="text-sm text-slate-600 line-clamp-3">
              {exposicion.descripcion}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {exposicion.fecha_inicio && exposicion.fecha_fin && (
              <span className="bg-slate-50 text-slate-600 px-3 py-1 rounded-full">
                {new Date(exposicion.fecha_inicio).toLocaleDateString()} –{" "}
                {new Date(exposicion.fecha_fin).toLocaleDateString()}
              </span>
            )}

            {exposicion.sala && (
              <span className="bg-slate-50 text-slate-600 px-3 py-1 rounded-full">
                {exposicion.sala}
              </span>
            )}

            {exposicion.estado && (
              <span
                className={`px-3 py-1 rounded-full font-semibold ${
                  esActiva
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {exposicion.estado}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
