"use client";

import { useEffect, useId, useRef } from "react";
import { initProcessStory } from "@/lib/process-story-motion";

export interface ProcessStep {
  id: string;
  label: string;
  title: string;
  lines: readonly string[];
  description: string;
  details: readonly string[];
}

export function ProcessStory({ steps, titleId }: { steps: readonly ProcessStep[]; titleId?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const headingId = titleId || `${id}-heading`;

  useEffect(() => {
    if (root.current) return initProcessStory(root.current);
  }, [steps]);

  return (
    <div ref={root} className="process-story" data-process-story>
      <div className="process-stage">
        <p className="home-overline"><span>CÓMO TRABAJAMOS</span><span>DE LA IDEA A LA OPERACIÓN</span></p>
        <div className="process-layout">
          <header className="process-intro">
            <h2 id={headingId}>Claridad desde<br />el primer día.</h2>
            <p>Entender tu negocio.<br />Definir el camino.<br />Hacer que avance.</p>
            <div className="process-index" aria-hidden="true">
              <div className="process-index-track"><span data-process-fill /><i data-process-dot /></div>
              <ol>{steps.map((step, index) => (
                <li key={step.id} data-process-index><span>{String(index + 1).padStart(2, "0")}</span><span className="process-index-label">{step.label}</span></li>
              ))}</ol>
            </div>
          </header>
          <div className="process-pages">
            {steps.map((step, index) => (
              <article className="process-page" data-process-page key={step.id} aria-labelledby={`${id}-${step.id}`}>
                <p className="process-step-label" data-process-copy><span>({String(index + 1).padStart(2, "0")})</span>{step.label}</p>
                <h3 id={`${id}-${step.id}`} aria-label={step.title}>
                  {step.lines.map(line => <span className="process-line-mask" key={line} aria-hidden="true"><span data-process-line>{line}</span></span>)}
                </h3>
                <div className="process-page-body" data-process-copy>
                  <p>{step.description}</p>
                  <ul aria-label="En esta etapa">{step.details.map(detail => <li key={detail}>{detail}</li>)}</ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
