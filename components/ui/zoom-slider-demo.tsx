"use client";

import { ZoomSliderComp } from "@/components/ui/zoom-slider";
import { processSliderData } from "@/components/process-cards";

export default function ZoomSliderDemo() {
  return <ZoomSliderComp sliderData={processSliderData} title="Una forma clara de avanzar." subheading="Cuatro etapas, de la primera conversación al seguimiento." />;
}
