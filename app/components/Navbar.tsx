// app/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Palette } from "lucide-react";

const links = [
  { href: "/inicio", label: "Inicio" },
  { href: "/obras", label: "Obras" },
  { href: "/exposiciones", label: "Exposiciones" },
  { href: "/about", label: "Acerca de" },
  { href: "/facturacion", label: "Comprar" },
];

export default function Navbar() {
  const pathname = usePathname();

  // No mostrar navbar en login / registro
  // No mostrar navbar en login o registro
  if (pathname === "/login" || pathname.startsWith("/registro") 
    || pathname.startsWith("/panel") || 
  pathname.startsWith("/Invitado") || 
  pathname.startsWith("../Invitado/page.tsx")) return null;

  const isActive = (href: string) => {
    if (href === "/inicio" && (pathname === "/" || pathname === "/inicio")) {
      return true;
    }
    return pathname === href || pathname?.startsWith(href);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo + texto */}
        <Link href="/inicio" className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#f5e6b3] text-[#b5851c] shadow-sm">
            <img src="logo-museo-veneris.png"/>
          </span>
          <div className="leading-tight">
            <p className="font-semibold text-slate-900 text-sm md:text-base">
              Museo Veneris
            </p>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              El amanecer eterno del arte
            </p>
          </div>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`pb-1 border-b-2 transition-all ${
                  isActive(link.href)
                    ? "border-[#cfa22e] text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Botón cuenta / login rápido */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 shadow-sm"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#f5e6b3] text-[#b5851c] text-xs font-semibold">
              J
            </span>
            <span className="hidden sm:block">Cuenta</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
