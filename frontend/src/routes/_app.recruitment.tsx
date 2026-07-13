import { createFileRoute } from "@tanstack/react-router";
import { Plus, Star, MapPin } from "lucide-react";
import { PageHeader } from "@/components/hrms/PageHeader";
import { Avatar } from "@/components/hrms/Avatar";
import { candidates, type Candidate } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/recruitment")({
  component: RecruitmentPage,
  head: () => ({ meta: [{ title: "Recruitment · Northwind IT" }] }),
});

const stages: { id: Candidate["stage"]; label: string; accent: string }[] = [
  { id: "applied", label: "Applied", accent: "bg-muted-foreground/60" },
  { id: "screening", label: "Screening", accent: "bg-info" },
  { id: "interview", label: "Interview", accent: "bg-primary" },
  { id: "offer", label: "Offer", accent: "bg-warning" },
  { id: "hired", label: "Hired", accent: "bg-success" },
];

function RecruitmentPage() {
  return (
    <>
      <PageHeader
        title="Recruitment pipeline"
        description="24 open roles across Engineering, Design and Sales"
        breadcrumbs={[{ label: "Home" }, { label: "People" }, { label: "Recruitment" }]}
        actions={
          <button className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-dark">
            <Plus className="h-4 w-4" /> Post job
          </button>
        }
      />
      <div className="mx-auto max-w-[1440px] px-6 py-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {stages.map((s) => {
            const cs = candidates.filter((c) => c.stage === s.id);
            return (
              <div key={s.id} className="flex min-h-[420px] flex-col rounded-xl border border-border bg-background/60 p-3">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className={cn("h-2 w-2 rounded-full", s.accent)} />
                  <span className="text-sm font-semibold">{s.label}</span>
                  <span className="rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground tabular">{cs.length}</span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {cs.map((c) => (
                    <div key={c.id} className="rounded-lg border border-border bg-surface p-3.5 shadow-[var(--shadow-resting)] transition hover:shadow-[var(--shadow-hover)]">
                      <div className="flex items-start gap-2.5">
                        <Avatar name={c.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{c.name}</div>
                          <div className="truncate text-[11px] text-muted-foreground">{c.role}</div>
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="rounded bg-muted px-1.5 py-0.5 font-medium">{c.yoe} yr</span>
                        <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {c.location}</span>
                        <span className="ml-auto flex items-center gap-0.5">
                          {c.rating > 0 ? (
                            <><Star className="h-3 w-3 fill-warning text-warning" /> <span className="tabular text-foreground">{c.rating}</span></>
                          ) : (
                            <span className="text-muted-foreground">–</span>
                          )}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>via {c.source}</span>
                        <span className="tabular">{c.appliedOn}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
