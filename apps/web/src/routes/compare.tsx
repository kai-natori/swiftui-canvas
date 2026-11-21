import { createFileRoute } from "@tanstack/react-router";

import { Compare } from "~/components/Compare";

export const Route = createFileRoute("/compare")({
  component: Compare,
});
