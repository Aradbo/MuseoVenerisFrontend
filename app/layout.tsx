import "../app/globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "./providers";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "Museo Veneris",
  description: "Frontend del Museo",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}>
        <Providers>
           <Navbar />
           {/* padding-top para que el contenido no quede debajo del navbar */}
          <main className="pt-16">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
