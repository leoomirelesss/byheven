import { hydrateRoot } from "react-dom/client";
import { ProcessCards } from "@/components/process-cards";

const container = document.querySelector<HTMLElement>("[data-process-cards]");
if (container) hydrateRoot(container, <ProcessCards />);
