import { useEffect } from "react";
import { hydrateRoot } from "react-dom/client";
import { ProcessCards } from "@/components/process-cards";
import { initProcessStory } from "@/assets/process-story.js";

function ProcessIsland() {
  useEffect(() => initProcessStory(), []);
  return <ProcessCards />;
}

const container = document.querySelector<HTMLElement>("[data-process-cards]");
if (container) hydrateRoot(container, <ProcessIsland />);
