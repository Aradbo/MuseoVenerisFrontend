// components/CardObra.tsx
import Link from "next/link";

type CardObraProps = {
  obra: {
    idObra_Arte: number;
    titulo: string;
    urls?: string | null;
    Artista?: string | null;
    anio_creacion?: string | null;
    nombre_coleccion?: string | null;
    destacada?: boolean | null;
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

export default function CardObra({ obra }: CardObraProps) {
  const img = getFirstImage(obra.urls ?? null);
  const year = obra.anio_creacion
    ? new Date(obra.anio_creacion).getFullYear()
    : undefined;

  return (
    <Link
      href={`/obras/${obra.idObra_Arte}`}
      className="group block h-full"
      prefetch
    >
      <article className="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden border border-slate-100 flex flex-col h-full">
        {/* Imagen */}
        <div className="bg-slate-50 aspect-[3/4] overflow-hidden">
          {img ? (
            <img
              src={img}
              alt={obra.titulo}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#fdf3d1] via-[#f5e6c8] to-[#f4f2ee]">
              <span className="text-5xl opacity-40">🎨</span>
            </div>
          )}
        </div>

        {/* Texto */}
        <div className="p-5 flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-[#CBA135] transition-colors line-clamp-2">
            {obra.titulo}
          </h3>

          {obra.Artista && (
            <p className="text-sm text-slate-600 line-clamp-1">
              {obra.Artista}
            </p>
          )}

          {year && (
            <p className="mt-1 inline-flex items-center text-[11px] uppercase tracking-wide bg-slate-50 text-slate-500 px-3 py-1 rounded-full">
              Año {year}
            </p>
          )}

          <div className="mt-1 flex flex-wrap gap-2">
            {obra.nombre_coleccion && (
              <span className="inline-flex items-center rounded-full bg-[#CBA135]/10 text-[#CBA135] text-xs font-medium px-3 py-1">
                {obra.nombre_coleccion}
              </span>
            )}
            {obra.destacada && (
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-[#CBA135] to-[#B8942F] text-white text-xs font-semibold px-3 py-1">
                Destacada
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
