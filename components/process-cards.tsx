import { GradientCard } from "@/components/ui/gradient-card";

export const processSteps = [
  {
    id: "review", label: "Tu negocio", title: "Primero, lo que necesitas.",
    description: "Revisamos tu tienda y cómo trabajas para definir qué conviene resolver primero.",
  },
  {
    id: "plan", label: "Ruta clara", title: "Sabes qué sigue.",
    description: "Acordamos el alcance, los entregables y los tiempos antes de empezar.",
  },
  {
    id: "build", label: "En marcha", title: "Lo ponemos a funcionar.",
    description: "Implementamos lo acordado y revisamos contigo los avances.",
  },
  {
    id: "follow", label: "Seguimiento", title: "Seguimos cerca.",
    description: "En Shopify, seguimos con la operación mensual. En otros proyectos, acordamos el soporte posterior.",
  },
] as const;

export function ProcessCards() {
  return processSteps.map((step, index) => (
    <figure className="process-story-card" key={step.id} data-process-card data-step-title={step.label}>
      <GradientCard
        gradient="purple"
        badgeText={`0${index + 1} / 04 · ${step.label}`}
        badgeColor="#806493"
        title={step.title}
        description={step.description}
        imageUrl={`/assets/process/${step.id}-3d.webp`}
      />
    </figure>
  ));
}
