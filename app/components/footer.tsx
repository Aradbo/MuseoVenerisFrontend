export default function Footer() {
  return (
    <footer className="bg-[#111418] text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          <div>
            <h3 className="text-[#CBA135] font-bold text-xl mb-3 tracking-wide">
              Museo Veneris
            </h3>
            <p className="text-sm max-w-xs leading-relaxed">
              Un espacio donde la belleza del arte trasciende el tiempo,
              inspirando a generaciones presentes y futuras.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-3">Horarios</h3>
            <p className="text-sm">Martes a Domingo</p>
            <p className="text-sm">09:00 AM — 11:30 PM</p>
            <p className="text-sm mt-2 text-[#CBA135] font-medium">Lunes cerrado</p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-3">Contacto</h3>
            <p className="text-sm">Col. Brisas de Altamira</p>
            <p className="text-sm">Ciudad de Comayagua</p>
            <p className="text-sm">museoarteveneris@museoveneris.com</p>
            <p className="text-sm">+504 8960-1143</p>
          </div>

        </div>

        <div className="border-t border-gray-700 mt-10 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Museo Veneris — Todos los derechos reservados.</p>
          <p className="text-[#CBA135] mt-2 italic">- El amanecer eterno del arte -</p>
        </div>
      </div>
    </footer>
  );
}
