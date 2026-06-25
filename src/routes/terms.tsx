import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Términos y Condiciones · Equit" },
      { name: "description", content: "Términos y condiciones de uso de Equit." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
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
          Términos y condiciones
        </h1>
        <div style={{ fontSize: 14, color: "var(--navy)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
{`TÉRMINOS Y CONDICIONES DE USO DE EQUIT
Última actualización: junio 2026

1. Sobre Equit
Equit es una aplicación de simulación de inversión con dinero virtual. No gestionamos dinero real, no ejecutamos órdenes en mercados financieros reales, y no prestamos servicios de inversión regulados. El contenido de la app tiene finalidad exclusivamente educativa e informativa.

2. Aceptación
Al crear una cuenta aceptas estos Términos. Si no estás de acuerdo, no uses la app. Debes tener al menos 16 años para registrarte.

3. El servicio
Equit te ofrece: (a) una cartera simulada con dinero virtual y precios de mercado en tiempo real obtenidos de terceros; (b) noticias financieras de fuentes externas; (c) información sobre carteras públicas de inversores reconocidos basada en declaraciones obligatorias (13F SEC y equivalentes); (d) análisis generados con inteligencia artificial con fines informativos; (e) funcionalidades sociales como rankings y comparación con otros usuarios.

4. No es asesoramiento financiero
El contenido de Equit, incluidos los análisis de IA, las noticias, las carteras de referentes y cualquier otro material, tiene carácter meramente informativo y no constituye asesoramiento financiero, recomendación de inversión, ni oferta de compra o venta de activos financieros. Las decisiones de inversión con dinero real son responsabilidad exclusiva del usuario. Equit no está registrada como empresa de servicios de inversión ante la CNMV.

5. Datos de mercado
Los precios e información de mercado se obtienen de proveedores externos (Finnhub, Yahoo Finance y otros). Equit no garantiza la exactitud, completitud o actualización de estos datos. Pueden existir retrasos o errores.

6. Carteras de referentes
Las carteras mostradas en la sección Referentes se basan en declaraciones públicas obligatorias (13F SEC) y otras fuentes públicas. Se actualizan trimestralmente. Los inversores mencionados no están afiliados a Equit ni la endorsan. Equit no tiene relación comercial con ninguno de ellos.

7. Contenido generado por IA
Equit utiliza sistemas de inteligencia artificial para generar análisis de noticias e informes semanales de mercado. Este contenido está claramente identificado como generado por IA y tiene finalidad exclusivamente informativa. No debe utilizarse como base para decisiones de inversión real.

8. Plan Premium
El plan Premium se factura mensualmente a 3,99€/mes mediante Stripe. Puedes cancelar en cualquier momento desde tu perfil. Al cancelar, mantienes el acceso Premium hasta el final del período facturado. No se realizan reembolsos por períodos parciales salvo en los casos previstos por la normativa de protección al consumidor de la UE (derecho de desistimiento de 14 días desde la primera suscripción).

9. Cuentas y seguridad
Eres responsable de mantener la confidencialidad de tu contraseña. Nos reservamos el derecho de suspender cuentas que incumplan estos términos, difundan contenido inapropiado o realicen un uso fraudulento del servicio.

10. Propiedad intelectual
El diseño, código, marca y contenido propio de Equit son propiedad de sus creadores. Los datos de mercado y las noticias pertenecen a sus respectivos proveedores y fuentes.

11. Limitación de responsabilidad
Equit no será responsable de pérdidas económicas derivadas del uso de la información proporcionada en la app, interrupciones del servicio, errores en datos de mercado, ni decisiones de inversión tomadas por los usuarios.

12. Modificaciones
Podemos actualizar estos términos notificándote con antelación razonable. El uso continuado de la app implica aceptación de los términos actualizados.

13. Ley aplicable
Estos términos se rigen por la legislación española. Para cualquier disputa, las partes se someten a los juzgados de Valencia.`}
        </div>
      </div>
    </div>
  );
}
