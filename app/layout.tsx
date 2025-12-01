import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "./providers";
import Navbar from "./components/Navbar";
import Footer from "@/app/components/footer"; // en minúscula como lo tenés

export const metadata = {
  title: "Museo Veneris",
  description: "El amanecer eterno del arte",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      {/* 🔥 FIX PRINCIPAL: flex + min-h-screen */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white min-h-screen flex flex-col`}>
        
        <Navbar />

        {/* El contenido crece y empuja el footer */}
        <Providers>
          <main className="flex-grow pt-16">
            {children}
          </main>
        </Providers>

        {/* Aquí aparece SIEMPRE */}
        <Footer />

      </body>
    </html>
  );
}
