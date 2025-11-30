"use client";

import { useEffect, useState, FormEvent } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Search, Calendar, Palette, ChevronRight, Sparkles } from "lucide-react";
import CardObra from "../components/CardObra";
import CardExposicion from "../components/CardExposicion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Respuesta genérica de la API basada en sendSpResponse / executeVIEW
type ApiListResponse<T> = {
  ok: boolean;
  data: T[];
  mensaje?: string;
};

// Coinciden con tu endpoint /api/obras
type Obra = {
  idObra_Arte: number;
  titulo: string;
  descripcion: string | null;
  anio_creacion: string | null;
  dimensiones: string | null;
  urls: string | null;
  Artista: string | null;
  nombre_coleccion?: string | null;
  destacada?: boolean | null;
};

// Coinciden con /api/exposiciones
type Exposicion = {
  idExposicion: number;
  nombre: string;
  descripcion: string | null;
  estado: string | null;
  urls: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  sala?: string | null;
};

export default function InicioPage() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [obras, setObras] = useState<Obra[]>([]);
  const [exposiciones, setExposiciones] = useState<Exposicion[]>([]);
  const [loadingObras, setLoadingObras] = useState(true);
  const [loadingExpos, setLoadingExpos] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [obrasResp, exposResp] = await Promise.all([
          axios.get<ApiListResponse<Obra>>(`${API_BASE}/api/obras`),
          axios.get<ApiListResponse<Exposicion>>(
            `${API_BASE}/api/exposiciones`
          ),
        ]);

        setObras(obrasResp.data?.data ?? []);
        setExposiciones(exposResp.data?.data ?? []);
      } catch (err) {
        console.error("Error cargando datos de inicio", err);
        setObras([]);
        setExposiciones([]);
      } finally {
        setLoadingObras(false);
        setLoadingExpos(false);
      }
    };

    cargarDatos();
  }, []);

  const obrasDestacadas = Array.isArray(obras) ? obras.slice(0, 6) : [];

  const exposicionesActivas = Array.isArray(exposiciones)
    ? exposiciones.filter((e) => (e.estado || "").toLowerCase().startsWith("a"))
    : [];

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = encodeURIComponent(searchQuery.trim());
    router.push(`/obras?search=${q}`);
  }

  const heroImages = [
    "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=1920&q=80",
    "https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?w=1920&q=80",
    "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=1920&q=80",
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setCurrentSlide((prev) => (prev + 1) % heroImages.length),
      5000
    );
    return () => clearInterval(timer);
  }, [heroImages.length]);

  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative h-[70vh] overflow-hidden">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={image}
              alt={`Hero ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
          </div>
        ))}

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4 max-w-4xl">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-[#CBA135]" />
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Museo Veneris
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200 italic">
              &quot;Donde la belleza se convierte en eternidad&quot;
            </p>
            <p className="text-lg md:text-xl mb-10 leading-relaxed max-w-3xl mx-auto">
              El Museo Veneris nace inspirado en la eterna fascinación humana
              por la belleza. Cada obra en nuestras salas cuenta una historia de
              pasión, técnica y visión artística que trasciende el tiempo.
            </p>

            {/* Buscador */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex gap-2 bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-2xl">
                <input
                  type="text"
                  placeholder="Buscar obras, artistas, exposiciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border-0 focus:outline-none focus:ring-0 text-[#1F2937] bg-transparent px-4 text-sm md:text-base"
                />
                <button
                  type="submit"
                  className="bg-[#CBA135] hover:bg-[#B8942F] text-white rounded-full px-5 md:px-8 flex items-center justify-center"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Indicadores */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? "bg-[#CBA135] w-8"
                  : "bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </section>

      {/* OBRAS DESTACADAS */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Palette className="w-8 h-8 text-[#CBA135]" />
                <h2 className="text-3xl md:text-4xl font-bold text-[#1F2937]">
                  Obras Destacadas
                </h2>
              </div>
              <p className="text-gray-600 text-lg">
                Descubre las joyas de nuestra colección permanente.
              </p>
            </div>
            <button
              onClick={() => router.push("/obras")}
              className="border border-[#CBA135] text-[#CBA135] hover:bg-[#CBA135] hover:text-white rounded-full px-5 py-2 text-sm flex items-center gap-2"
            >
              Ver todas <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loadingObras ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-[3/4] rounded-t-2xl" />
                  <div className="bg-gray-100 p-4 rounded-b-2xl">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : obrasDestacadas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {obrasDestacadas.map((obra) => (
                <CardObra key={obra.idObra_Arte} obra={obra} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#F9F6F1] rounded-2xl border border-dashed border-[#e4d5b2]">
              <p className="text-gray-500 text-lg">
                Pronto añadiremos obras destacadas.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* EXPOSICIONES ACTUALES */}
      <section className="py-16 px-4 bg-[#F9F6F1]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-8 h-8 text-[#CBA135]" />
                <h2 className="text-3xl md:text-4xl font-bold text-[#1F2937]">
                  Exposiciones Actuales
                </h2>
              </div>
              <p className="text-gray-600 text-lg">
                No te pierdas nuestras exhibiciones temporales.
              </p>
            </div>
            <button
              onClick={() => router.push("/exposiciones")}
              className="border border-[#CBA135] text-[#CBA135] hover:bg-[#CBA135] hover:text-white rounded-full px-5 py-2 text-sm flex items-center gap-2"
            >
              Ver todas <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loadingExpos ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-[4/3] rounded-t-2xl" />
                  <div className="bg-gray-100 p-4 rounded-b-2xl">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : exposicionesActivas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {exposicionesActivas.map((expo) => (
                <CardExposicion key={expo.idExposicion} exposicion={expo} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white/80 rounded-2xl border border-dashed border-[#e4d5b2]">
              <p className="text-gray-500 text-lg">
                Actualmente no hay exposiciones activas.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* MINI ABOUT */}
      <section className="py-20 bg-gradient-to-br from-[#F9F6F1] to-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1F2937] mb-6">
            Nuestra esencia
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            En el Museo Veneris honramos el talento de artistas consagrados y
            emergentes, celebramos la diversidad de miradas y defendemos el
            arte como un lenguaje universal. Nuestro propósito es que cada
            visitante sienta que estuvo frente a algo eterno, aunque haya sido
            solo por unos instantes.
          </p>
        </div>
      </section>
    </div>
  );
}
