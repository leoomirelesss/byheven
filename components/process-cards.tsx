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
    <article className="process-story-card" key={step.id} data-process-card data-step-title={step.label}>
      <p className="process-step-kicker"><span>{String(index + 1).padStart(2, "0")}</span>{step.label}</p>
      <h3>{step.title}</h3>
      <p className="process-step-description">{step.description}</p>
      <img className="process-step-icon" src={`/assets/process/${step.id}-3d.webp`} width={128} height={128} alt="" aria-hidden="true" loading="lazy" decoding="async" draggable={false} />
    </article>
  ));
}
