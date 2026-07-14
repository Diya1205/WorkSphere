import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/hrms/AppLayout";

export const Route = createFileRoute("/_app")({
  ssr: false,

  beforeLoad: () => {
    const token = sessionStorage.getItem("access");
    
    if (!token) {
      throw redirect({
        to: "/auth",
      });
    }
  },

  component: AppLayout,
});