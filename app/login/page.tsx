// app/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const resp = await axios.post("http://localhost:3000/api/auth/login", {
        usuario,
        contrasenia,
        correo,
      });

if (resp.data.ok) {
    localStorage.setItem("token", resp.data.token);
    localStorage.setItem("tipoUsuario", resp.data.tipoUsuario);
    localStorage.setItem("idEmpleado", resp.data.idEmpleado ?? "");
    localStorage.setItem("idVisitante", resp.data.idVisitante ?? "");

    //CLAVE: también guardarlo en cookie para middleware ---
    document.cookie = `tipoUsuario=${resp.data.tipoUsuario}; path=/; max-age=7200`; // 2 horas

    if (resp.data.tipoUsuario === "Empleado") {
        router.push("/panel");
    } else {
        router.push("/inicio");
    }
}


        setError("No se pudo determinar el tipo de usuario.");
        return;
      
    } catch (err: any) {
      setError(
        err?.response?.data?.mensaje ||
          "Usuario, correo o contraseña incorrectos."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    // NextAuth se encarga de todo el flujo
    signIn("google");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b1020] via-[#131b30] to-[#1a2b4a]">
      <div className="w-full max-w-4xl flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)] bg-gradient-to-br from-white/15 to-white/5 border border-white/15 backdrop-blur-xl">
        {/* Lado izquierdo – branding */}
        <div className="md:w-1/2 p-10 flex flex-col justify-between bg-gradient-to-br from-[#0b1020] via-[#131b30] to-[#1a2b4a] text-white">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Museo Veneris
            </h1>
            <p className="text-sm text-blue-100/80">
              “El amanecer eterno del arte”
            </p>
          </div>

          <div className="mt-10 space-y-3 text-sm text-blue-100/90">
            <p>• Empleados ingresan con usuario, correo y contraseña.</p>
            <p>• Visitantes pueden iniciar con Google o crear su cuenta.</p>
          </div>

          <div className="mt-10 text-xs text-blue-200/70">
            © {new Date().getFullYear()} Museo Veneris. Todos los derechos
            reservados.
          </div>
        </div>

        {/* Lado derecho – formulario */}
        <div className="md:w-1/2 p-8 md:p-10 bg-gradient-to-b from-white/90 to-white/95">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
            Bienvenido
          </h2>
          <p className="text-sm text-gray-500 mb-6 text-center">
            Inicia sesión para acceder al panel del museo.
          </p>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuario
              </label>
              <input
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#e0b251] focus:border-[#e0b251] bg-white"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo
              </label>
              <input
                type="email"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#e0b251] focus:border-[#e0b251] bg-white"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#e0b251] focus:border-[#e0b251] bg-white"
                value={contrasenia}
                onChange={(e) => setContrasenia(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-xl bg-[#f0b400] hover:bg-[#ffcc33] text-gray-900 font-semibold py-2.5 text-sm shadow-md shadow-yellow-500/30 disabled:opacity-70 disabled:cursor-not-allowed transition"
            >
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">o continúa con</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <button
            onClick={handleGoogleLogin}
            className="mt-4 flex items-center justify-center gap-3 w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 hover:bg-gray-50 shadow-sm transition"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Iniciar sesión con Google
          </button>

          <p className="mt-4 text-[11px] text-center text-gray-400">
            Si tu correo no existe en el sistema, te llevaremos al registro de
            visitante.
          </p>

          <button
  type="button"
  onClick={() => {
    localStorage.setItem("tipoUsuario", "Invitado");
    localStorage.removeItem("token");
    localStorage.removeItem("idEmpleado");
    localStorage.removeItem("idVisitante");
    router.push("../Invitado");
  }}
  className="w-full mt-3 rounded-xl border border-gray-300 text-gray-700 text-sm py-2.5 hover:bg-gray-50 transition"
>
  Entrar como Invitado
</button>

        </div>
      </div>
    </div>
  );
}
