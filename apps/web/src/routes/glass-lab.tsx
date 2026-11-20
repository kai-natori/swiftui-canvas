import { createFileRoute } from "@tanstack/react-router";

import { GlassLab } from "~/components/GlassLab";

export const Route = createFileRoute("/glass-lab")({
  component: GlassLab,
});
