import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import api from "@/services/api";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
  head: () => ({
    meta: [{ title: "Sign in · WorkSphere HRMS" }],
  }),
});

function AuthPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/auth/", {
        email,
        password,
      });

      sessionStorage.setItem("access", response.data.access);
      sessionStorage.setItem("refresh", response.data.refresh);
      sessionStorage.setItem("user", JSON.stringify(response.data.user));
      toast.success("Login successful");

      navigate({
        to: "/dashboard",
      });
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-lg">

        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            W
          </div>

          <div>
            <div className="text-lg font-semibold">
              WorkSphere
            </div>

            <div className="text-xs text-muted-foreground">
              Human Resource Management System
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome Back
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Email
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Password
            </label>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

        </form>

      </div>
    </div>
  );
}