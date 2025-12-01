export default function NosotrosPage() {
  return (
    <div className="min-h-screen bg-[#0C0C0E] text-gray-200">

      {/* 🏛️ HERO SECTION */}
      <section 
        className="relative h-[70vh] flex items-center justify-center text-center"
        style={{ backgroundImage: "url('/hero-arte.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        
        <div className="relative z-10 max-w-3xl px-6">
          <h1 className="text-[#CBA135] text-5xl font-bold drop-shadow-[0_0_10px_rgba(203,161,53,0.7)]">
            Museo Veneris
          </h1>
          <p className="text-lg text-gray-300 mt-3 italic">
            - El amanecer eterno del arte -
          </p>
        </div>
      </section>

      {/* 📜 HISTORIA */}
      <section className="max-w-6xl mx-auto px-6 py-20 space-y-6 leading-relaxed">
        <h2 className="text-3xl font-bold text-[#CBA135]">Nuestra Historia</h2>
        <p className="text-gray-300 text-lg">
          Museo Veneris nace con el propósito de preservar, compartir y exaltar 
          la esencia del arte a través del tiempo. Inspirado en la figura de Venus, 
          símbolo eterno de belleza y creación, nuestro museo se convierte en un 
          puente entre las obras clásicas y las expresiones contemporáneas que 
          definen nuestra visión del mundo.
        </p>
        <p className="text-gray-400">
          Iniciamos con una colección íntima, guiada por el deseo profundo de hacer 
          del arte una experiencia accesible, memorable y transformadora. Hoy, Veneris 
          abre sus puertas para recibir visitantes físicos y digitales, ofreciendo 
          un recorrido que trasciende espacios, épocas y estilos.
        </p>
      </section>

      {/* 🌟 MISIÓN & VISIÓN */}
      <section className="bg-black/30 py-20 border-y border-[#CBA135]/20">
        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto px-6">

          <div className="p-8 bg-[#111111]/70 rounded-xl border border-[#CBA135]/20 hover:border-[#CBA135]/40 transition">
            <h3 className="text-2xl font-bold text-[#CBA135] mb-3">Misión</h3>
            <p className="text-gray-300 leading-loose">
              Preservar el arte en todas sus formas, rindiendo homenaje a las 
              culturas, artistas y movimientos que han construido la belleza 
              histórica del mundo, mientras inspiramos nuevas generaciones 
              a crear, admirar y sentir.
            </p>
          </div>

          <div className="p-8 bg-[#111111]/70 rounded-xl border border-[#CBA135]/20 hover:border-[#CBA135]/40 transition">
            <h3 className="text-2xl font-bold text-[#CBA135] mb-3">Visión</h3>
            <p className="text-gray-300 leading-loose">
              Convertirnos en un santuario universal del arte, expandiendo nuestras 
              exposiciones físicas y virtuales, promoviendo experiencias inmersivas 
              y construyendo una comunidad que respira historia, creatividad y expresión.
            </p>
          </div>

        </div>
      </section>

      {/* 💛 VALORES */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-[#CBA135] mb-12 text-center">Nuestros Valores</h2>

        <div className="grid md:grid-cols-3 gap-10">

          <div className="text-center p-6 bg-[#101010] border border-[#CBA135]/25 rounded-xl hover:bg-[#CBA135]/10 transition">
            <h4 className="text-xl font-semibold text-[#CBA135]">Pasión</h4>
            <p className="text-gray-400 text-sm mt-2">
              El arte es nuestro pulso, sentimiento vivo que impulsa cada proyecto.
            </p>
          </div>

          <div className="text-center p-6 bg-[#101010] border border-[#CBA135]/25 rounded-xl hover:bg-[#CBA135]/10 transition">
            <h4 className="text-xl font-semibold text-[#CBA135]">Cultura</h4>
            <p className="text-gray-400 text-sm mt-2">
              Honramos el pasado, transformamos el presente e inspiramos el futuro.
            </p>
          </div>

          <div className="text-center p-6 bg-[#101010] border border-[#CBA135]/25 rounded-xl hover:bg-[#CBA135]/10 transition">
            <h4 className="text-xl font-semibold text-[#CBA135]">Innovación</h4>
            <p className="text-gray-400 text-sm mt-2">
              Creemos en experiencias digitales, inmersivas y accesibles para todos.
            </p>
          </div>

        </div>
      </section>

      {/* 🖼 SECCIÓN FINAL */}
      <section className="relative h-[50vh] flex items-center justify-center">
        <img 
          src="/hero-arte.jpg" // Puedes cambiar por exposición real
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"/>
        
        <h3 className="relative z-10 text-3xl font-light text-gray-200 text-center max-w-3xl px-4">
          El arte es eterno, y en Veneris encuentra un hogar donde la historia vive,
          respira, y se transforma en experiencia.
        </h3>
      </section>

    </div>
  );
}
