import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/organiser")({
  beforeLoad: () => {
    throw redirect({ to: "/curators" });
  },
});
