"use client";

import {
  useEffect,
  useMemo,
  useState,
  FormEvent,
} from "react";
import axios from "axios";
import {
  ShoppingCart,
  Package,
  Ticket,
  Trash2,
  FileText,
  Moon,
  Sun,
  History,
  CreditCard,
  ExternalLink,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/* ========= Tipos según tu API / BD ========= */

interface Producto {
  idProducto: number;
  nombre: string;
  descripcion?: string | null;
  precio_venta: number;
  stock?: number | null;
   urlImagen?: string | null;
}

interface Tour {
  idTour: number;
  fecha_hora_inicio: string | null;
  fecha_hora_fin: string | null;
  estado: string | null;
  capacidad: number | null;
}

interface MetodoPago {
  idMetodoPago: number;
  descripcion: string;
}

interface Precio {
  idPrecio: number;
  tipo_tarifa: string;
  precio: number;
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

type TipoCarrito = "producto" | "tour";

interface CarritoItem {
  tipo: TipoCarrito;
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface FacturaHistorial {
  codigoFactura: string | null;
  fechaISO: string;
  visitante: string;
  tipo_tarifa: string;
  total: number;
  items: CarritoItem[];
}

/* ===== Helper para normalizar arrays de tus endpoints ===== */
function normalizeArray<T = any>(raw: any): T[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.recordset)) return raw.recordset;
  return [];
}

/* ===== Helper para formatear fecha bonita ===== */
function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-HN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function FacturacionPage() {
  /* ============== UI MODE / DARK THEME ============== */
  const [dark, setDark] = useState(false);

  /* ============== DATA STORES ============== */
  const [productos, setProductos] = useState<Producto[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [precios, setPrecios] = useState<Precio[]>([]);

  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [usuario, setUsuario] = useState("");
  const [tarifa, setTarifa] = useState("Adulto");
  const [metodoPagoId, setMetodoPagoId] = useState<string>("");

  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [busquedaTour, setBusquedaTour] = useState("");

  const [historial, setHistorial] = useState<FacturaHistorial[]>([]);
  const [loadingPago, setLoadingPago] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ============== PERSISTENCIA LOCAL (carrito + dark + historial) ============== */
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedCarrito = localStorage.getItem("mv_carrito");
      const storedDark = localStorage.getItem("mv_dark");
      const storedHist = localStorage.getItem("mv_historial_facturas");

      if (storedCarrito) {
        setCarrito(JSON.parse(storedCarrito));
      }
      if (storedDark === "1") {
        setDark(true);
      }
      if (storedHist) {
        setHistorial(JSON.parse(storedHist));
      }
    } catch {
      // ignore
    }

    // PWA: registro simple de service worker (si lo creas como /sw.js)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => {
          // si no existe, no rompe nada
        });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("mv_carrito", JSON.stringify(carrito));
    } catch {
      // ignore
    }
  }, [carrito]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("mv_dark", dark ? "1" : "0");
    } catch {
      // ignore
    }
  }, [dark]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("mv_historial_facturas", JSON.stringify(historial));
    } catch {
      // ignore
    }
  }, [historial]);

  /* ============== Cargar Catálogos desde API ============== */
  useEffect(() => {
    async function load() {
      try {
        const [p, t, m, pr] = await Promise.all([
          axios.get(`${API}/api/productos`),
          axios.get(`${API}/api/tours`),
          axios.get(`${API}/api/metodos-pago`),
          axios.get(`${API}/api/precios`),
        ]);

        setProductos(normalizeArray<Producto>(p.data));
        setTours(normalizeArray<Tour>(t.data));
        setMetodosPago(normalizeArray<MetodoPago>(m.data));

        const preciosRaw = normalizeArray<any>(pr.data);
        setPrecios(
          preciosRaw.map((x: any) => ({
            idPrecio: x.idPrecio,
            tipo_tarifa: x.tipo_tarifa,
            precio: x.precio ?? x.precio_venta ?? 0,
            fechaInicio: x.fechaInicio ?? x.fecha_inicio ?? null,
            fechaFin: x.fechaFin ?? x.fecha_fin ?? null,
          }))
        );
      } catch (err) {
        console.error("⚠ Error cargando catálogos", err);
        setError("No se pudieron cargar los catálogos de facturación.");
      }
    }
    load();
  }, []);

  /* ============== Precio actual de la tarifa seleccionada ============== */
  const precioTarifaActual = useMemo(() => {
    if (!precios.length) return 0;
    const hoy = new Date();

    // Buscar precio activo para la tarifa seleccionada
    const candidatos = precios.filter((p) => {
      if (
        p.tipo_tarifa?.toLowerCase().trim() !== tarifa.toLowerCase().trim()
      ) {
        return false;
      }
      const ini = p.fechaInicio ? new Date(p.fechaInicio) : null;
      const fin = p.fechaFin ? new Date(p.fechaFin) : null;

      if (ini && ini > hoy) return false;
      if (fin && fin < hoy) return false;
      return true;
    });

    if (!candidatos.length) return 0;

    // Tomar el más reciente por fechaInicio
    candidatos.sort((a, b) => {
      const da = a.fechaInicio ? new Date(a.fechaInicio).getTime() : 0;
      const db = b.fechaInicio ? new Date(b.fechaInicio).getTime() : 0;
      return db - da;
    });

    return candidatos[0].precio ?? 0;
  }, [precios, tarifa]);


  /* ============== Filtrado de catálogos para buscador ============== */
  const productosFiltrados = useMemo(() => {
    const q = busquedaProducto.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.descripcion ?? "").toLowerCase().includes(q)
    );
  }, [productos, busquedaProducto]);

  const toursFiltrados = useMemo(() => {
    const q = busquedaTour.trim().toLowerCase();
    if (!q) return tours;
    return tours.filter((t) => {
      const txt =
        `${formatDateTime(t.fecha_hora_inicio)} ${formatDateTime(
          t.fecha_hora_fin
        )}`.toLowerCase();
      return txt.includes(q);
    });
  }, [tours, busquedaTour]);

  /* ============== Totales ============== */
  const subtotalProductos = useMemo(
    () =>
      carrito
        .filter((i) => i.tipo === "producto")
        .reduce((a, i) => a + i.precio * i.cantidad, 0),
    [carrito]
  );

  const subtotalTours = useMemo(
    () =>
      carrito
        .filter((i) => i.tipo === "tour")
        .reduce((a, i) => a + i.precio * i.cantidad, 0),
    [carrito]
  );

  const subtotal = subtotalProductos + subtotalTours;

  // la entrada del visitante según tarifa seleccionada (una por factura)
  const tarifaBase = precioTarifaActual;

  // Total estimado sin impuestos/ni descuentos (los aplica el SP en SQL)
  const total = useMemo(
    () => subtotal + tarifaBase,
    [subtotal, tarifaBase]
  );

  /* ============== AGREGAR AL CARRITO ============== */

  function agregarProducto(
    id: number,
    nombre: string,
    precio: number,
    cantidad: number
  ) {
    if (cantidad <= 0) return;
    setCarrito((prev) => {
      const ya = prev.find((i) => i.tipo === "producto" && i.id === id);
      if (ya) {
        return prev.map((i) =>
          i.tipo === "producto" && i.id === id
            ? { ...i, cantidad: i.cantidad + cantidad }
            : i
        );
      }
      return [
        ...prev,
        { tipo: "producto", id, nombre, precio, cantidad },
      ];
    });
  }


  function agregarTour(id: number, label: string, cantidad: number) {
  if (cantidad <= 0) return;

  // Precio depende SIEMPRE de la tarifa en el momento agregado
  const precio = precioTarifaActual;

 
  //id + tarifa = item único.
  setCarrito((prev) => {
    const ya = prev.find(
      (i) =>
        i.tipo === "tour" &&
        i.id === id &&
        i.precio === precio // si cambia tarifa, cambia precio, es item nuevo
    );

    if (ya) {
      // si coincide tour+tarifa, solo sumamos cantidad
      return prev.map((i) =>
        i.tipo === "tour" && i.id === id && i.precio === precio
          ? { ...i, cantidad: i.cantidad + cantidad }
          : i
      );
    }

    // si NO coincide tarifa, crear una nueva línea independiente
    return [
      ...prev,
      { tipo: "tour", id, nombre: label, precio, cantidad },
    ];
  });
}


  function eliminarItemCarrito(index: number) {
    setCarrito((prev) => prev.filter((_, i) => i !== index));
  }

  function limpiarCarrito() {
    setCarrito([]);
  }

  /* ============== Historial: generar PDF a partir de una factura (versión HTML rápida) ============== */

  function generarPDFDesdeFactura(f: FacturaHistorial) {
    const { codigoFactura, fechaISO, items, total, visitante, tipo_tarifa } = f;

    const sub = items.reduce((a, i) => a + i.precio * i.cantidad, 0);
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charSet="UTF-8" />
        <title>Factura Museo Veneris</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; background: #f9fafb; }
          h1 { color: #CBA135; margin-bottom: 4px; }
          h2 { margin-top: 24px; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          th { background: #111827; color: #fff; text-align: left; }
          .text-right { text-align: right; }
          .totales { margin-top: 16px; float: right; width: 260px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .row.final { margin-top: 8px; padding-top: 8px; border-top: 2px solid #CBA135; font-weight: bold; font-size: 18px; color: #CBA135; }
          .small { font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <h1>Museo Veneris</h1>
        <p class="small">"El amanecer eterno del arte"</p>

        <h2>Factura electrónica</h2>
        <p><strong>Código:</strong> ${codigoFactura ?? "N/A"}</p>
        <p><strong>Fecha:</strong> ${new Date(fechaISO).toLocaleString("es-HN")}</p>
        <p><strong>Visitante:</strong> ${visitante}</p>
        <p><strong>Tarifa:</strong> ${tipo_tarifa}</p>

        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Cant.</th>
              <th class="text-right">Precio</th>
              <th class="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (i) => `
              <tr>
                <td>${i.tipo === "tour" ? "Tour · " : "Producto · "}${
                  i.nombre
                }</td>
                <td>${i.cantidad}</td>
                <td class="text-right">L ${i.precio.toFixed(2)}</td>
                <td class="text-right">L ${(i.precio * i.cantidad).toFixed(
                  2
                )}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="totales">
          <div class="row">
            <span>Subtotal:</span>
            <span>L ${sub.toFixed(2)}</span>
          </div>
          <div class="row final">
            <span>TOTAL:</span>
            <span>L ${total.toFixed(2)}</span>
          </div>
        </div>
      </body>
      </html>
    `;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  /* ============== REGISTRAR FACTURA PÚBLICO ============== */

  async function manejarPago(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!usuario.trim()) {
      setError("Ingresa el nombre completo del visitante.");
      return;
    }
    if (!metodoPagoId) {
      setError("Debes seleccionar un método de pago.");
      return;
    }
    if (carrito.length === 0) {
      setError("El carrito está vacío.");
      return;
    }

    const listaProductos =
      carrito
        .filter((i) => i.tipo === "producto")
        .map((i) => `${i.id}|${i.cantidad}`)
        .join(",") || null;

    const listaTours =
      carrito
        .filter((i) => i.tipo === "tour")
        .map((i) => `${i.id}|${i.cantidad}`)
        .join(",") || null;

    const payload = {
      nombreVisitante: usuario,
      tipo_tarifa: tarifa,
      listaProductos,
      listaTours,
      idMetodoPago: Number(metodoPagoId),
      // El SP recalcula total real con impuestos/desc, esto es un estimado:
      montoPago: total,
    };

    try {
      setLoadingPago(true);
      const res = await axios.post(
        `${API}/api/facturas-publico/registrar-publico`,
        payload
      );

      const codigo =
        res.data?.codigo ||
        res.data?.codigoFactura ||
        res.data?.codigo_factura ||
        null;

      const nuevaFactura: FacturaHistorial = {
        codigoFactura: codigo,
        fechaISO: new Date().toISOString(),
        visitante: usuario,
        tipo_tarifa: tarifa,
        total,
        items: carrito,
      };

      setHistorial((prev) => [nuevaFactura, ...prev]);
      setCarrito([]);
      setUsuario("");
      setMetodoPagoId("");
      setError(null);

      alert("Compra realizada correctamente ✨");
    } catch (err: any) {
      console.error("Error registrando factura público", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.Mensaje ||
        "No se pudo registrar la factura.";
      setError(msg);
    } finally {
      setLoadingPago(false);
    }
  }

  /* ============== Pasarela simulada PayPal / Stripe ============== */

  function simularPayPal() {
    if (!total) return alert("Agrega elementos al carrito antes de pagar.");
    alert(
      "Aquí se integraría la pasarela PayPal real (SDK JS) con el monto: L " +
        total.toFixed(2)
    );
  }

  function simularStripe() {
    if (!total) return alert("Agrega elementos al carrito antes de pagar.");
    alert(
      "Aquí se integraría Stripe Checkout o PaymentIntent con el monto: L " +
        total.toFixed(2)
    );
  }

  /* ============== RENDER UI ============== */

  const bgRoot = dark
    ? "bg-[#050816] text-slate-100"
    : "bg-gradient-to-b from-[#F4F7FF] via-[#F9F6F1] to-[#Fdfcf8] text-slate-900";

  return (
    <div className={`${bgRoot} min-h-screen py-10`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* CARD PRINCIPAL */}
        <div
          className={`relative rounded-3xl border ${
            dark ? "border-slate-800 bg-black/40" : "border-[#e4d9b3] bg-white/80"
          } shadow-2xl backdrop-blur-md p-6 md:p-8`}
        >
          {/* botón dark mode */}
          <button
            onClick={() => setDark((v) => !v)}
            className={`absolute right-6 top-6 inline-flex items-center justify-center rounded-full p-2 shadow-md ${
              dark
                ? "bg-slate-900 text-yellow-300"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Encabezado */}
          <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-bold tracking-tight">
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                    dark ? "bg-[#1E293B]" : "bg-[#FDE68A]"
                  }`}
                >
                  <ShoppingCart
                    className={dark ? "text-[#FACC15]" : "text-[#92400E]"}
                  />
                </span>
                Facturación — Museo Veneris
              </h1>
              <p
                className={`mt-1 text-sm ${
                  dark ? "text-slate-300" : "text-slate-600"
                } max-w-xl`}
              >
                Compra tus boletos para tours y souvenirs de la tienda del
                museo. Tu factura se genera de forma automática y puedes
                descargarla en PDF.
              </p>
            </div>

            <div
              className={`rounded-2xl px-4 py-3 text-xs md:text-sm ${
                dark ? "bg-slate-900/70 border border-slate-700" : "bg-[#FEF3C7] border border-[#FBBF24]"
              }`}
            >
              <p className="font-semibold">
                Tarifa seleccionada:{" "}
                <span className="text-[#FACC15]">{tarifa}</span>
              </p>
              <p className={dark ? "text-slate-300" : "text-slate-700"}>
                Precio base estimado:{" "}
                <span className="font-semibold">
                  L {precioTarifaActual.toFixed(2)}
                </span>{" "}
                por boleto
              </p>
            </div>
          </header>

          {error && (
            <div className="mb-4 rounded-xl border border-red-400 bg-red-50/80 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* GRID PRINCIPAL */}
          <form
            onSubmit={manejarPago}
            className="grid grid-cols-1 gap-8 lg:grid-cols-[1.5fr,1.1fr]"
          >
            {/* COLUMNA IZQUIERDA: catálogo productos + tours */}
            <section className="space-y-6">
              {/* Productos */}
              <div className={`rounded-2xl border p-4 md:p-5 space-y-4 ${
                dark ? "bg-slate-900/60 border-slate-800" : "bg-[#FDFBF5] border-[#E5E7EB]"
              }`}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                      <Package className={dark ? "text-[#FACC15]" : "text-[#92400E]"} />
                      Productos de la tienda
                    </h2>
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={busquedaProducto}
                      onChange={(e)=>setBusquedaProducto(e.target.value)}
                      className={`w-full md:w-56 rounded-full border px-3 py-1.5 text-xs ${
                        dark?"border-slate-700 bg-slate-950/60 text-slate-100":"border-slate-200 bg-white"
                      }`}
                    />
                  </div>
                      
                {/* 🟡 PRODUCTOS EN CARD */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-80 overflow-y-auto pr-2">
                                      
                  {productosFiltrados.map(p => (
                    <div
                      key={p.idProducto}
                      className="group bg-white border border-[#e5d9a4] shadow-sm
                      hover:shadow-[0_0_12px_#cba13590] hover:border-[#cba135] transition
                      rounded-xl p-3 cursor-pointer transform hover:-translate-y-[2px]"
                    >
                      {/* Mostrar Imagen si existe */}
                      {p.urlImagen ? (
                        <img
                          src={`http://localhost:3000${p.urlImagen}`} // <<--- ASÍ CARGA!!!
                          alt={p.nombre}
                          className="w-full h-32 object-cover rounded-lg mb-2 shadow-sm hover:shadow-lg duration-200"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gradient-to-br from-[#e9dcb9] to-[#c7a658] rounded-lg flex items-center justify-center text-sm text-[#553d10] font-semibold">
                          Sin imagen
                        </div>
                      )}

                      <p className="font-semibold text-sm">{p.nombre}</p>
                      <p className="text-[#c9a035] font-bold text-base">L {p.precio_venta.toFixed(2)}</p>
                      <p className="text-xs opacity-60">Stock: {p.stock ?? "N/D"}</p>
                    
                      <button
                        onClick={() => agregarProducto(p.idProducto,p.nombre,p.precio_venta,1)}
                        className="mt-2 bg-[#CBA135] text-white w-full py-1.5 rounded-lg text-xs font-semibold
                        hover:bg-[#a38227] transition"
                      >
                        + Agregar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
                  

              {/* Tours */}
              <div className={`rounded-2xl border p-4 md:p-5 space-y-4 ${
                dark?"bg-slate-900/60 border-slate-800":"bg-[#EEF2FF] border-[#CBD5F5]"
              }`}>
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <Ticket className={dark?"text-[#93C5FD]":"text-[#1D4ED8]"} />
                    Tours disponibles
                  </h2>
              
                  <input
                    placeholder="Buscar tour..."
                    value={busquedaTour}
                    onChange={(e)=>setBusquedaTour(e.target.value)}
                    className="w-full rounded-lg border px-3 py-1.5 text-xs"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {toursFiltrados.map(t=> {
                      const label = `Tour #${t.idTour} — ${formatDateTime(t.fecha_hora_inicio)}`
                      return(
                        <div key={t.idTour}
                          onClick={()=>agregarTour(t.idTour,label,1)}
                          className={`p-4 rounded-xl border cursor-pointer transition ${
                            dark?"border-slate-700 hover:bg-slate-800/50":"border-slate-300 hover:bg-[#DBEAFE]/50"
                          }`}
                        >
                          <b>{label}</b>
                          <p className="text-xs opacity-60">Capacidad {t.capacidad??"N/D"}</p>
                          <p className="font-bold text-[#1D4ED8]">L {precioTarifaActual.toFixed(2)}</p>
                        </div>
                      )
                    })}
                  </div>
              </div>
            </section>

            {/* COLUMNA DERECHA: carrito + pago + pasarelas + historial corto */}
            <section className="space-y-6">
              {/* Carrito */}
              <div className={`rounded-2xl border p-4 ${
                dark?"bg-slate-900/70":"bg-[#F9FAFB]"
              }`}>
                  <h2 className="font-semibold flex items-center gap-2">
                    <ShoppingCart className="text-[#FACC15]" /> Carrito
                  </h2>
              
                  {carrito.length===0 && <p className="text-xs opacity-60 mt-2">Vacío</p>}
              
                  <div className="max-h-48 overflow-y-auto mt-3 space-y-2">
                    {carrito.map((i,idx)=>(
                      <div key={idx} className="flex justify-between items-center border rounded-lg px-3 py-2">
                        <div>
                          <b>{i.nombre}</b>
                          <p className="text-xs opacity-60">{i.cantidad} × L {i.precio.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">L {(i.precio*i.cantidad).toFixed(2)}</p>
                          <button onClick={()=>eliminarItemCarrito(idx)} className="text-red-500 text-xs">Quitar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t mt-3 pt-3 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><b>L {subtotal.toFixed(2)}</b></div>
                    <div className="flex justify-between"><span>Tarifa visitante</span><b>L {tarifaBase.toFixed(2)}</b></div>
                    <p className="text-[11px] opacity-50">Impuestos y descuentos se aplicarán automáticamente</p>
                    <div className="flex justify-between text-lg font-bold mt-1 text-[#FACC15]">
                      <span>Total</span><span>L {total.toFixed(2)}</span>
                    </div>
                  </div>
              </div>

              {/* Pago + datos visitante + pasarelas */}
              <div
                className={`rounded-2xl border p-4 md:p-5 space-y-4 ${
                  dark ? "bg-slate-900/70 border-slate-800" : "bg-[#FEF9C3] border-[#FDE68A]"
                }`}
              >
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <CreditCard className="w-5 h-5 text-[#F97316]" />
                  Datos de pago
                </h2>

                <div className="space-y-2 text-sm">
                  <input
                    type="text"
                    placeholder="Nombre completo del visitante"
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      dark
                        ? "border-slate-700 bg-slate-950/60 text-slate-100 focus:ring-blue-500/60"
                        : "border-slate-300 bg-white text-slate-800 focus:ring-blue-400/70"
                    }`}
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                  />

                  <select
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      dark
                        ? "border-slate-700 bg-slate-950/60 text-slate-100 focus:ring-blue-500/60"
                        : "border-slate-300 bg-white text-slate-800 focus:ring-blue-400/70"
                    }`}
                    value={tarifa}
                    onChange={(e) => setTarifa(e.target.value)}
                  >
                    <option value="Adulto">Adulto</option>
                    <option value="Niño">Niño</option>
                    <option value="Estudiante">Estudiante</option>
                    <option value="Tercera Edad">Tercera Edad</option>
                    <option value="Extranjero">Extranjero</option>
                  </select>

                  <select
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      dark
                        ? "border-slate-700 bg-slate-950/60 text-slate-100 focus:ring-blue-500/60"
                        : "border-slate-300 bg-white text-slate-800 focus:ring-blue-400/70"
                    }`}
                    value={metodoPagoId}
                    onChange={(e) => setMetodoPagoId(e.target.value)}
                  >
                    <option value="">Método de pago</option>
                    {metodosPago.map((m) => (
                      <option
                        key={m.idMetodoPago}
                        value={m.idMetodoPago}
                      >
                        {m.descripcion}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loadingPago || carrito.length === 0}
                  className={`mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold shadow-md transition ${
                    loadingPago || carrito.length === 0
                      ? "cursor-not-allowed opacity-60"
                      : ""
                  } ${
                    dark
                      ? "bg-[#FACC15] text-slate-900 hover:bg-[#EAB308]"
                      : "bg-[#CBA135] text-white hover:bg-[#B38A27]"
                  }`}
                >
                  {loadingPago ? "Procesando..." : "Confirmar compra y generar factura"}
                </button>

                {/* Pasarelas simuladas */}
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 text-xs">
                  <button
                    type="button"
                    onClick={simularPayPal}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 font-medium ${
                      dark
                        ? "border-slate-700 bg-slate-950/70 hover:bg-slate-800/80"
                        : "border-slate-300 bg-white hover:bg-slate-100"
                    }`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Pagar con PayPal (demo)
                  </button>
                  <button
                    type="button"
                    onClick={simularStripe}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 font-medium ${
                      dark
                        ? "border-slate-700 bg-slate-950/70 hover:bg-slate-800/80"
                        : "border-slate-300 bg-white hover:bg-slate-100"
                    }`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Pagar con Stripe (demo)
                  </button>
                </div>
              </div>

              {/* Historial resumido */}
              <div
                className={`rounded-2xl border p-4 space-y-3 text-xs md:text-sm ${
                  dark ? "bg-slate-900/70 border-slate-800" : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <History className="h-4 w-4 text-[#FACC15]" />
                    Historial reciente de facturas
                  </h3>
                  {historial.length > 0 && (
                    <span
                      className={
                        dark ? "text-slate-400 text-[11px]" : "text-slate-500 text-[11px]"
                      }
                    >
                      {historial.length} factura(s)
                    </span>
                  )}
                </div>

                {historial.length === 0 ? (
                  <p
                    className={
                      dark ? "text-slate-500" : "text-slate-400"
                    }
                  >
                    Aún no has registrado facturas desde este dispositivo.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {historial.slice(0, 5).map((f, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                          dark
                            ? "border-slate-700 bg-slate-950/60"
                            : "border-slate-200 bg-[#F9FAFB]"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {f.codigoFactura ?? "Sin código"}
                          </span>
                          <span
                            className={
                              dark ? "text-slate-400 text-[11px]" : "text-slate-500 text-[11px]"
                            }
                          >
                            {new Date(f.fechaISO).toLocaleString(
                              "es-HN"
                            )}{" "}
                            · {f.visitante} · {f.tipo_tarifa}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            L {f.total.toFixed(2)}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                `${API}/api/pdf/publico/${f.codigoFactura}`,
                                "_blank"
                              )
                            }
                            className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#FACC15] hover:text-[#FBBF24]"
                          >
                            <FileText className="h-3 w-3" />
                            Descargar PDF
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </form>
        </div>
      </div>
    </div>
  );
}
