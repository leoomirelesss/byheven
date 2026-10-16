import { ProcessStory } from "@/components/ui/process-story";

export const processSteps = [
  {
    id: "review", label: "Tu negocio", title: "Primero, lo que necesitas.",
    lines: ["Primero,", "lo que necesitas."],
    description: "Revisamos tu tienda y cómo trabajas para definir qué conviene resolver primero.",
    details: ["Revisión de tienda", "Operación actual", "Prioridades"],
  },
  {
    id: "plan", label: "Ruta clara", title: "Sabes qué sigue.",
    lines: ["Sabes", "qué sigue."],
    description: "Acordamos el alcance, los entregables y los tiempos antes de empezar.",
    details: ["Alcance", "Entregables", "Calendario"],
  },
  {
    id: "build", label: "En marcha", title: "Lo ponemos a funcionar.",
    lines: ["Lo ponemos", "a funcionar."],
    description: "Implementamos lo acordado y revisamos contigo los avances.",
    details: ["Implementación", "Revisiones", "Ajustes"],
  },
  {
    id: "follow", label: "Seguimiento", title: "Seguimos cerca.",
    lines: ["Seguimos", "cerca."],
    description: "En Shopify, seguimos con la operación mensual. En otros proyectos, acordamos el soporte posterior.",
    details: ["Operación mensual", "Soporte acordado", "Mejoras siguientes"],
  },
] as const;

export function ProcessCards() {
  return <ProcessStory steps={processSteps} titleId="home-process-title" />;
}
