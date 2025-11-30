"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  LayoutDashboard,
  ImageIcon,
  Sparkles,
  ShoppingBag,
  Users,
  Ticket,
  ArrowRight,
  CreditCard,
  BarChart3,
  CalendarClock,
  Palette,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface ResumenPanel {
  totalObras: number;
  totalExposActivas: number;
  totalProductos: number;
  totalTours: number;
  totalVisitantes: number;
  ventasHoy: number;
  ingresosHoy: number;
}

export default function PanelPage() {
  const router = useRouter();

  const [cargandoAuth, setCargandoAuth] = useState(true);
  const [cargandoResumen, setCargandoResumen] = useState(true);
  const [resumen, setResumen] = useState<ResumenPanel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nombreEmpleado, setNombreEmpleado] = useState<string>("");

  // 🔐 Validar que sea empleado
  useEffect(() => {
    const tipo = localStorage.getItem("tipoUsuario");
    const idEmpleado = localStorage.getItem("idEmpleado");
    const nombre = localStorage.getItem("nombreEmpleado");

    if (tipo !== "Empleado" || !idEmpleado) {
      router.replace("/inicio");
      return;
    }

    if (nombre) setNombreEmpleado(nombre);
    setCargandoAuth(false);
  }, [router]);

  // 📊 Cargar resumen del panel
  useEffect(() => {
    if (cargandoAuth) return;

    async function cargarDatos() {
      try {
        setCargandoResumen(true);
        setError(null);

        const res = await axios.get(`${API}/api/panel/resumen`);
        setResumen(res.data);
      } catch (err) {
        console.error("Error cargando resumen del panel", err);
        setError("No se pudo cargar el resumen del panel.");
        setResumen(null);
      } finally {
        setCargandoResumen(false);
      }
    }

    cargarDatos();
  }, [cargandoAuth]);

  if (cargandoAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050816] text-slate-100">
        Cargando panel...
      </div>
    );
  }

  const stats = [
    {
      id: "obras",
      titulo: "Obras registradas",
      valor: resumen?.totalObras ?? 0,
      descripcion: "Piezas en la colección del museo.",
      icon: ImageIcon,
      color: "from-[#FACC15] to-[#CBA135]",
      onClick: () => router.push("/panel/obras"),
    },
    {
      id: "expos",
      titulo: "Exposiciones activas",
      valor: resumen?.totalExposActivas ?? 0,
      descripcion: "Experiencias abiertas al público.",
      icon: Palette,
      color: "from-[#22C55E] to-[#16A34A]",
      onClick: () => router.push("/panel/exposiciones"),
    },
    {
      id: "productos",
      titulo: "Productos en tienda",
      valor: resumen?.totalProductos ?? 0,
      descripcion: "Souvenirs, catálogos y más.",
      icon: ShoppingBag,
      color: "from-[#38BDF8] to-[#0EA5E9]",
      onClick: () => router.push("/panel/productos"),
    },
    {
      id: "tours",
      titulo: "Tours programados",
      valor: resumen?.totalTours ?? 0,
      descripcion: "Recorridos guiados creados.",
      icon: Ticket,
      color: "from-[#A855F7] to-[#7C3AED]",
      onClick: () => router.push("/panel/tours"),
    },
    {
      id: "visitantes",
      titulo: "Visitantes registrados",
      valor: resumen?.totalVisitantes ?? 0,
      descripcion: "En la base de datos.",
      icon: Users,
      color: "from-[#FB7185] to-[#F97316]",
      onClick: () => router.push("/panel/visitantes"),
    },
    {
      id: "ingresos",
      titulo: "Ingresos hoy",
      valor: resumen?.ingresosHoy ?? 0,
      descripcion: `Ventas: ${resumen?.ventasHoy ?? 0} factura(s)`,
      icon: BarChart3,
      color: "from-[#4ADE80] to-[#22C55E]",
      onClick: () => router.push("/panel/facturas"),
      esDinero: true,
    },
  ];

  const quickActions = [
    {
      id: "nueva-venta",
      titulo: "Registrar nueva venta",
      descripcion: "Facturación rápida desde el panel.",
      icon: CreditCard,
      href: "/panel/facturar", // aquí luego usaremos SP_RegistrarFacturasCompleta
    },
    {
      id: "gestionar-obras",
      titulo: "Gestionar artistas y obras",
      descripcion: "Altas, bajas y edición de piezas.",
      icon: ImageIcon,
      href: "/panel/obras",
    },
    {
      id: "gestionar-expos",
      titulo: "Gestionar colecciones y expos",
      descripcion: "Curaduría y programación.",
      icon: Sparkles,
      href: "/panel/exposiciones",
    },
    {
      id: "gestionar-tours",
      titulo: "Gestionar tours",
      descripcion: "Horarios, tarifas y capacidad.",
      icon: CalendarClock,
      href: "/panel/tours",
    },
    {
      id: "gestionar-productos",
      titulo: "Gestionar productos",
      descripcion: "Tienda del museo, stock e imágenes.",
      icon: ShoppingBag,
      href: "/panel/productos",
    },
    {
      id: "empleados",
      titulo: "Ver información de empleados",
      descripcion: "Privilegios e historial (vistas).",
      icon: Users,
      href: "/panel/empleados",
    },
  ];

  return (
  <div className="min-h-screen bg-gradient-to-b from-[#dbeafe] via-[#e0f2fe] to-[#f0f9ff] text-[#0b1a33]">
    <div className="max-w-6xl mx-auto px-6 py-10">

      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-10">
        <div>
          <h1 className="flex items-center gap-3 text-4xl font-bold">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#38bdf8] to-[#0ea5e9] shadow-md">
              <LayoutDashboard className="w-6 h-6 text-white"/>
            </span>
            Panel administrativo — Museo Veneris
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Bienvenido{nombreEmpleado ? `, ${nombreEmpleado}` : ""}. Gestión interna operativa.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr,1.6fr]">

        {/* Sección Acciones rápidas */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            <Sparkles className="text-[#0284c7]"/> Acciones rápidas
          </h2>

          <div className="grid gap-3">
            {quickActions.map(a =>{
              const Icon=a.icon;
              return(
                <button key={a.id}
                onClick={()=>router.push(a.href)}
                className="flex items-center justify-between rounded-xl px-4 py-3 bg-white border border-slate-200 hover:border-[#0ea5e9] hover:shadow-lg transition">
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-9 flex items-center justify-center bg-[#e0f2fe] rounded-lg">
                      <Icon className="text-[#0284c7]"/>
                    </span>
                    <div>
                      <p className="font-medium">{a.titulo}</p>
                      <p className="text-[11px] opacity-70">{a.descripcion}</p>
                    </div>
                  </div>
                  <ArrowRight/>
                </button>
              );
            })}
          </div>
        </section>

        {/* Tarjetas Estadísticas */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            <BarChart3 className="text-[#0284c7]"/> Resumen operativo
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {stats.map(s=>{
              const Icon=s.icon;
              return(
                <button key={s.id} onClick={s.onClick}
                className="rounded-xl p-5 bg-white shadow-md border border-slate-200 hover:shadow-xl hover:border-[#0284c7] transition">
                  
                  <div className="flex justify-between">
                    <div>
                      <p className="text-xs text-slate-500">{s.titulo}</p>
                      <p className="text-3xl font-bold text-[#0284c7]">{s.esDinero?`L ${s.valor.toFixed(2)}`:s.valor}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{s.descripcion}</p>
                    </div>
                    <span className="h-10 w-10 flex items-center justify-center rounded-lg bg-[#e0f2fe] border border-[#bae6fd]">
                      <Icon className="text-[#0284c7]"/>
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  </div>
);
}
