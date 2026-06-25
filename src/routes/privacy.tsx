import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Política de privacidad · Equit" },
      { name: "description", content: "Política de privacidad de Equit." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const navigate = useNavigate();
  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh", overflowY: "auto" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "1.5rem" }}>
        <button
          type="button"
          onClick={() => navigate({ to: ".." as never })}
          className="inline-flex items-center gap-1.5 mb-4 text-sm font-medium"
          style={{ color: "var(--navy)" }}
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <h1 className="text-2xl font-semibold mb-4" style={{ color: "var(--navy)" }}>
          Política de privacidad
        </h1>
        <div style={{ fontSize: 14, color: "var(--navy)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
{`POLÍTICA DE PRIVACIDAD DE EQUIT
Última actualización: junio 2026

1. Responsable del tratamiento
Hugo Ample — Equit — privacidad@equit.app

2. Datos que recogemos
Datos de registro: nombre de usuario, dirección de email, contraseña (encriptada). Datos de uso: actividad en la app, posiciones simuladas, historial de lectura de noticias. Datos de pago: gestionados íntegramente por Stripe — Equit no almacena datos de tarjeta. Datos técnicos: dirección IP, tipo de dispositivo, versión del sistema operativo.

3. Finalidad y base legal
Prestación del servicio (ejecución de contrato — Art. 6.1.b RGPD). Mejora del servicio mediante análisis de uso (interés legítimo — Art. 6.1.f RGPD). Comunicaciones sobre el servicio (ejecución de contrato — Art. 6.1.b RGPD). Procesamiento de pagos (ejecución de contrato — Art. 6.1.b RGPD).

4. Conservación de datos
Conservamos tus datos mientras mantengas una cuenta activa. Al eliminar tu cuenta, borramos tus datos personales en un plazo máximo de 30 días, salvo obligación legal de conservarlos.

5. Destinatarios
Compartimos datos únicamente con proveedores técnicos necesarios para el servicio: Supabase (base de datos, alojado en UE), Stripe (pagos), y proveedores de datos de mercado (Finnhub). No vendemos datos a terceros ni los usamos para publicidad.

6. Tus derechos
Tienes derecho a acceder, rectificar, suprimir, limitar el tratamiento y portar tus datos. Escríbenos a privacidad@equit.app. También puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).

7. Seguridad
Utilizamos cifrado en tránsito (HTTPS) y en reposo. Los datos de autenticación se gestionan a través de Supabase Auth con estándares de seguridad del sector.

8. Menores
La edad mínima para usar Equit es 16 años. No recopilamos conscientemente datos de menores de 16 años.`}
        </div>
      </div>
    </div>
  );
}
