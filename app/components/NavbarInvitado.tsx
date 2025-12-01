"use client";

import Link from "next/link";
import { Palette, Lock } from "lucide-react";

const linksInvitado = [
  { href: "/Invitado", label: "Inicio" },
  { href: "../Invitado/obras", label: "Obras" },
  { href: "../Invitado/exposiciones", label: "Exposiciones" },
  { href: "../Invitado/about", label: "Acerca de" },
];

export default function NavbarInvitado() {

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/Invitado" className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#f5e6b3] text-[#b5851c] shadow-sm">
            <img src="logo-museo-veneris.png"/>
          </span>
          <div className="leading-tight">
            <p className="font-semibold text-slate-900 text-sm md:text-base">Museo Veneris</p>
            <p className="text-[11px] text-slate-500 hidden sm:block">Vista visitante</p>
          </div>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 text-sm">
            {linksInvitado.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="pb-1 border-b-2 border-transparent text-slate-600 hover:text-[#cfa22e] hover:border-[#cfa22e] transition-all"
              >
                {link.label}
              </Link>
            ))}

            {/* 🔒 Comprar bloqueado */}
            <button
              className="cursor-not-allowed opacity-50 pb-1 border-b-2 border-transparent text-slate-400 flex items-center gap-1"
              title="Inicie sesión para comprar"
            >
              <Lock className="w-4 h-4" /> Comprar
            </button>
          </div>

          {/* Botón Login */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 shadow-sm"
          >
            Iniciar sesión
          </Link>
        </div>
      </nav>
    </header>
  );
}
