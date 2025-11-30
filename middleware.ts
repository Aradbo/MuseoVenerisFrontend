import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const tipo = req.cookies.get("tipoUsuario")?.value || req.headers.get("tipoUsuario") || null;

  // Protección exclusiva para empleados
  if (url.pathname.startsWith("/panel")) {
    const tipoLocal = req.cookies.get("tipoUsuario")?.value;

    if (tipoLocal !== "Empleado") {
      url.pathname = "/inicio"; // redirige a visitante
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*"], // protege todo /panel/*
};
