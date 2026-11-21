import { createFileRoute } from "@tanstack/react-router";

import { ComponentsPage } from "~/components/ComponentsPage";

export const Route = createFileRoute("/components")({
  component: ComponentsPage,
});
