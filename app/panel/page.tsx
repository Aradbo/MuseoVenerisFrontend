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

const API = process.env.NEXT_PUBLIC_API_URL;

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
      titulo: "Ingresos hoy -MUY PRONTO ESTA FUNCION",
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
    id: "facturar",
    titulo: "Registrar nueva venta",
    descripcion: "PRONTO DISPONIBLE",
    icon: CreditCard,
    color: "from-gray-500 to-gray",
    href: null,              // NO navegará
    disabled: true,          // para manejar estilo y bloqueo
    tag: "Próximamente",     // etiqueta visible
  },

  {
    id: "obras",
    titulo: "Gestionar obras",
    descripcion: "Alta, baja y edición de piezas artísticas.",
    icon: ImageIcon,
    color: "from-yellow-400 to-amber-500",
    href: "/panel/obras",
  },
  {
    id: "artistas",
    titulo: "Gestionar artistas",
    descripcion: "Administrar autores y perfiles culturales.",
    icon: Sparkles,
    color: "from-pink-400 to-rose-500",
    href: "/panel/artistas",
  },
  {
    id: "expos",
    titulo: "Gestionar exposiciones",
    descripcion: "Curaduría, programación y estado.",
    icon: Palette,
    color: "from-green-400 to-emerald-600",
    href: "/panel/exposiciones",
  },
  {
    id: "salas",
    titulo: "Gestionar salas",
    descripcion: "Zonas, espacios y áreas del museo.",
    icon: LayoutDashboard,
    color: "from-indigo-400 to-indigo-600",
    href: "/panel/salas",
  },
  {
    id: "tours",
    titulo: "Gestionar tours",
    descripcion: "Horarios, recorridos guiados y acceso.",
    icon: CalendarClock,
    color: "from-purple-400 to-violet-600",
    href: "/panel/tours",
  },
  {
    id: "productos",
    titulo: "Gestionar productos",
    descripcion: "Tienda del museo, stock e imágenes.",
    icon: ShoppingBag,
    color: "from-blue-400 to-sky-600",
    href: "/panel/productos",
  },
  {
    id: "visitantes",
    titulo: "Gestionar visitantes",
    descripcion: "Registro y control de acceso público.",
    icon: Users,
    color: "from-orange-400 to-amber-600",
    href: "/panel/visitantes",
  },
  {
    id: "empleados-info",
    titulo: "Ver información de empleados",
    descripcion: "Historial, privilegios y actividad.",
    icon: Users,
    color: "from-gray-400 to-gray-600",
    href: "/panel/empleados/informacion",
  },
];



  return (
  <div className="min-h-screen bg-gradient-to-b from-[#dbeafe] via-[#e0f2fe] to-[#f0f9ff] text-[#0b1a33]">
    <div className="max-w-6xl mx-auto px-6 py-10">

      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-10">
        <div>
          
           <button onClick={()=>location.href="/login"}
          className="px-4 py-2 bg-[#76d0ee] text-white rounded hover:bg-[#435fa7]">
        ← Volver a login</button> <br /> <br /> 
       

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
    const disabled = a.disabled || !a.href;   // ← si no trae href o está marcado disabled
  const gradient = a.color ?? "from-gray-400 to-gray-600";
    return(
      <button key={a.id}
      disabled={disabled}   
      onClick={()=>router.push(a.href!)}
      className="flex items-center justify-between rounded-xl px-4 py-4 bg-white border border-slate-200 hover:shadow-md hover:border-transparent hover:bg-gradient-to-r transition group duration-200"
      style={{ backgroundImage:`linear-gradient(to right, var(--tw-gradient-stops))` }}>

        <div className="flex items-center gap-3">
          <span className={`h-10 w-10 flex items-center justify-center text-white rounded-lg bg-gradient-to-br ${a.color}`}>
            <Icon size={20}/>
          </span>
          <div>
            <p className="font-semibold text-[14px]">{a.titulo}</p>
            <p className="text-[11px] opacity-80">{a.descripcion}</p>
          </div>
        </div>

        <ArrowRight className="opacity-70 group-hover:translate-x-1 transition"/>
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
