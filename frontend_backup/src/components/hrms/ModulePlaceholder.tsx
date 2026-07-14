import { PageHeader } from "@/components/hrms/PageHeader";
import { Construction } from "lucide-react";

export function ModulePlaceholder({
  title,
  description,
  copy,
}: {
  title: string;
  description: string;
  copy: string;
}) {
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[{ label: "Home" }, { label: title }]}
      />
      <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-8">
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
            <Construction className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">{title} module</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{copy}</p>
        </div>
      </div>
    </>
  );
}
