import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Aviso legal · Equit" },
      { name: "description", content: "Aviso legal y política de cookies de Equit." },
    ],
  }),
  component: LegalPage,
});

function LegalPage() {
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
          Aviso legal
        </h1>
        <div style={{ fontSize: 14, color: "var(--navy)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
{`AVISO LEGAL Y POLÍTICA DE COOKIES

Equit es un servicio operado por Hugo Ample, con domicilio en Valencia, España.
Contacto legal: legal@equit.app

El acceso y uso de Equit implica la aceptación de los Términos y Condiciones y la Política de Privacidad disponibles en la app. El contenido de Equit tiene carácter informativo y no constituye asesoramiento financiero, recomendación de inversión ni oferta de servicios financieros regulados. Equit no está inscrita en los registros de la CNMV como empresa de servicios de inversión.

Los análisis generados mediante inteligencia artificial están identificados como tal de conformidad con el artículo 50 del Reglamento (UE) 2024/1689 (AI Act).

POLÍTICA DE COOKIES
Equit utiliza cookies técnicas estrictamente necesarias para el funcionamiento del servicio (sesión de usuario, preferencias). No utilizamos cookies de publicidad ni de seguimiento de terceros con fines comerciales. Stripe, nuestro procesador de pagos, puede utilizar cookies propias durante el proceso de pago. Puedes configurar tu navegador para bloquear cookies, aunque esto puede afectar al funcionamiento de la app.`}
        </div>
      </div>
    </div>
  );
}
