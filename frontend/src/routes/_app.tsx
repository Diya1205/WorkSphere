import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/hrms/AppLayout";
import { authStorage } from "@/lib/auth-storage";
export const Route = createFileRoute("/_app")({
  ssr: false,

  beforeLoad: () => {
    const token = authStorage.getItem("access");
    
    if (!token) {
      throw redirect({
        to: "/auth",
      });
    }
  },

  component: AppLayout,
});