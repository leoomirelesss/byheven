import { GradientCard } from "@/components/ui/gradient-card";
import { processSteps } from "@/components/process-cards";

export default function GradientCardDemo() {
  return (
    <div className="grid grid-cols-1 gap-8 p-4 md:grid-cols-2 sm:p-8">
      {processSteps.map((step, index) => (
        <GradientCard
          key={step.id}
          gradient="purple"
          badgeText={`0${index + 1} / 04 · ${step.label}`}
          badgeColor="#806493"
          title={step.title}
          description={step.description}
          imageUrl={`/assets/process/${step.id}-3d.webp`}
          ctaText="Hablemos de tu proyecto"
          ctaHref="/#contact"
        />
      ))}
    </div>
  );
}
