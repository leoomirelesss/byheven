import { ZoomSliderComp, type ZoomSliderItem } from "@/components/ui/zoom-slider";

export const processSteps = [
  {
    id: "review", label: "Tu negocio", title: "Primero, lo que necesitas.",
    description: "Revisamos tu tienda y cómo trabajas para definir qué conviene resolver primero.",
    details: ["Revisión de tienda", "Operación actual", "Prioridades"],
  },
  {
    id: "plan", label: "Ruta clara", title: "Sabes qué sigue.",
    description: "Acordamos el alcance, los entregables y los tiempos antes de empezar.",
    details: ["Alcance", "Entregables", "Calendario"],
  },
  {
    id: "build", label: "En marcha", title: "Lo ponemos a funcionar.",
    description: "Implementamos lo acordado y revisamos contigo los avances.",
    details: ["Implementación", "Revisiones", "Ajustes"],
  },
  {
    id: "follow", label: "Seguimiento", title: "Seguimos cerca.",
    description: "En Shopify, seguimos con la operación mensual. En otros proyectos, acordamos el soporte posterior.",
    details: ["Operación mensual", "Soporte acordado", "Mejoras siguientes"],
  },
] as const;

export const processSliderData: readonly ZoomSliderItem[] = processSteps.map((step, index) => ({
  number: String(index + 1).padStart(2, "0"), src: `/assets/process/${step.id}-3d.webp`,
  title: step.title, desc: step.description, eyebrow: step.label, details: step.details,
}));

export function ProcessCards() {
  return <ZoomSliderComp sliderData={processSliderData} />;
}
