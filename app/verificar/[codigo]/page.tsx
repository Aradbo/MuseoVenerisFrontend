"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle, FileText, ArrowLeft } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function VerificarFactura() {
  const { codigo } = useParams(); 
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<"loading"|"ok"|"fail">("loading");

  useEffect(() => {
    async function fetchData(){
      try{
        const resp = await fetch(`${API}/api/factura/validar/${codigo}`);
        const json = await resp.json();

        if(json.ok){
          setData(json.data);
          setStatus("ok");
        }else{
          setStatus("fail");
        }
      }catch{
        setStatus("fail");
      }
    }
    fetchData();
  }, [codigo]);

  return(
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#111] text-white p-6">

      {status==="loading" &&(
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin w-10 h-10 text-[#FACC15]" />
          <p className="opacity-80">Verificando autenticidad...</p>
        </div>
      )}

      {status==="fail" &&(
        <div className="flex flex-col items-center gap-3">
          <XCircle size={70} className="text-red-500"/>
          <h2 className="text-xl font-bold text-red-400">Factura No válida</h2>
          <p className="text-gray-300 text-center max-w-sm">
            Este código no existe o el documento fue alterado.
          </p>
          <a href="/" className="mt-4 text-gray-200 underline">Volver al inicio</a>
        </div>
      )}

      {status==="ok" &&(
        <div className="bg-[#1b1b1b] p-8 rounded-xl shadow-lg border border-[#FACC15]/30 w-full max-w-xl animate-fade-in">

          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={50} className="text-[#22c55e]" />
            <h2 className="text-2xl font-bold text-[#FACC15]">Factura verificada</h2>
          </div>

          <p className="text-gray-300 mb-4">Documento auténtico y registrado en el sistema.</p>

          <div className="bg-black/40 rounded-lg p-5 space-y-2 border border-[#FACC15]/20">
            <div className="flex justify-between"><b>Código:</b> <span>{data.codigo_factura}</span></div>
            <div className="flex justify-between"><b>Visitante:</b> <span>{data.visitante}</span></div>
            <div className="flex justify-between"><b>Tarifa:</b> <span>{data.tipo_tarifa}</span></div>
            <div className="flex justify-between"><b>Total:</b> <span>L {data.total.toFixed(2)}</span></div>
            <div className="flex justify-between"><b>Impuestos:</b> <span>L {data.total_impuesto.toFixed(2)}</span></div>
            <div className="flex justify-between"><b>Descuentos:</b> <span>L {data.total_descuento.toFixed(2)}</span></div>
          </div>

          <div className="flex justify-between mt-6">
            <a href="" className="flex items-center gap-2 text-gray-200 hover:text-white">
              <ArrowLeft size={18}/> Volver
            </a>
            <a 
              href={`${API}/api/pdf/publico/${data.codigo_factura}`}
              target="_blank"
              className="flex items-center gap-2 bg-[#FACC15] px-4 py-2 rounded-md text-black font-semibold hover:bg-[#e9b30e]"
            >
              <FileText size={18}/> Descargar PDF
            </a>
          </div>

        </div>
      )}
    </main>
  );
}
