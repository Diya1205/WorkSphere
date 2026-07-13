import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Video, Calendar, Clock } from "lucide-react";
import { PageHeader } from "@/components/hrms/PageHeader";
import { Avatar } from "@/components/hrms/Avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/live/meetings")({
  component: LiveMeetingsPage,
  head: () => ({ meta: [{ title: "Meetings · Northwind IT" }] }),
});

const sb = supabase as any;

function LiveMeetingsPage() {
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; meeting: any | null }>({ open: false, meeting: null });

  const { data: profiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => (await sb.from("profiles").select("id, full_name")).data ?? [],
  });

  const { data, isLoading } = useQuery({
    enabled: !!me,
    queryKey: ["live-meetings"],
    queryFn: async () => {
      const [{ data: meetings }, { data: mp }] = await Promise.all([
        sb.from("meetings").select("*").order("meeting_date", { ascending: true }),
        sb.from("meeting_participants").select("meeting_id, user_id"),
      ]);
      return { meetings: meetings ?? [], mp: mp ?? [] };
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("meetings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["live-meetings"] }); toast.success("Meeting deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Meetings"
        description={me?.role === "employee" ? "Meetings you're invited to" : "All scheduled meetings"}
        breadcrumbs={[{ label: "Home" }, { label: "Live" }, { label: "Meetings" }]}
        actions={
          <button onClick={() => setModal({ open: true, meeting: null })} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-dark">
            <Plus className="h-4 w-4" /> New meeting
          </button>
        }
      />

      <div className="mx-auto max-w-[1440px] px-6 py-6 lg:px-8">
        {isLoading ? (
          <div className="grid place-items-center py-16 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /></div>
        ) : !data || data.meetings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface py-16 text-center">
            <div className="text-sm text-muted-foreground">No meetings scheduled</div>
            <button onClick={() => setModal({ open: true, meeting: null })} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-dark">
              <Plus className="h-4 w-4" /> Schedule a meeting
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.meetings.map((m: any) => {
              const parts = data.mp.filter((r: any) => r.meeting_id === m.id).map((r: any) => profiles?.find((p: any) => p.id === r.user_id)).filter(Boolean);
              const canManage = me && (me.role === "admin" || m.created_by === me.id);
              return (
                <div key={m.id} className="group rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-resting)] transition hover:shadow-[var(--shadow-hover)]">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{m.title}</h3>
                    {canManage && (
                      <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                        <button onClick={() => setModal({ open: true, meeting: m })} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-accent"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => { if (confirm("Delete this meeting?")) del.mutate(m.id); }} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-danger-soft hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground tabular">
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {m.meeting_date}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {String(m.meeting_time).slice(0, 5)}</span>
                  </div>
                  {m.link && (
                    <a href={m.link} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                      <Video className="h-3.5 w-3.5" /> Join
                    </a>
                  )}
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <div className="flex -space-x-2">
                      {parts.slice(0, 5).map((p: any) => <Avatar key={p.id} name={p.full_name} size="xs" />)}
                      {parts.length > 5 && <div className="grid h-6 w-6 place-items-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-surface">+{parts.length - 5}</div>}
                    </div>
                    <span className="text-[11px] text-muted-foreground">{parts.length} participant{parts.length === 1 ? "" : "s"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal.open && me && profiles && (
        <MeetingModal
          meeting={modal.meeting}
          me={me}
          profiles={profiles}
          existingParticipants={modal.meeting ? data!.mp.filter((r: any) => r.meeting_id === modal.meeting.id).map((r: any) => r.user_id) : [me.id]}
          onClose={() => setModal({ open: false, meeting: null })}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["live-meetings"] }); setModal({ open: false, meeting: null }); }}
        />
      )}
    </>
  );
}

function MeetingModal({ meeting, me, profiles, existingParticipants, onClose, onSaved }: any) {
  const isEdit = !!meeting;
  const [title, setTitle] = useState(meeting?.title ?? "");
  const [date, setDate] = useState(meeting?.meeting_date ?? new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(String(meeting?.meeting_time ?? "10:00").slice(0, 5));
  const [link, setLink] = useState(meeting?.link ?? "");
  const [participants, setParticipants] = useState<string[]>(existingParticipants);
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => setParticipants((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let meetingId = meeting?.id;
      if (isEdit) {
        const { error } = await sb.from("meetings").update({ title, meeting_date: date, meeting_time: time, link: link || null }).eq("id", meetingId);
        if (error) throw error;
        await sb.from("meeting_participants").delete().eq("meeting_id", meetingId);
      } else {
        const { data: inserted, error } = await sb.from("meetings").insert({ title, meeting_date: date, meeting_time: time, link: link || null, created_by: me.id }).select("id").single();
        if (error) throw error;
        meetingId = inserted.id;
      }
      if (participants.length) {
        const rows = participants.map((user_id) => ({ meeting_id: meetingId, user_id }));
        const { error } = await sb.from("meeting_participants").insert(rows);
        if (error) throw error;
      }
      toast.success(isEdit ? "Meeting updated" : "Meeting created");
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl">
        <h2 className="text-lg font-semibold">{isEdit ? "Edit meeting" : "New meeting"}</h2>
        <div className="mt-4 space-y-3">
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted-foreground">Title</span>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1 block text-xs font-medium text-muted-foreground">Date</span>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="input" /></label>
            <label className="block"><span className="mb-1 block text-xs font-medium text-muted-foreground">Time</span>
              <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="input" /></label>
          </div>
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted-foreground">Video link</span>
            <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://meet.example.com/…" className="input" /></label>
          <div>
            <div className="mb-1.5 text-xs font-medium text-muted-foreground">Participants ({participants.length})</div>
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-md border border-border p-2">
              {profiles.map((p: any) => {
                const on = participants.includes(p.id);
                return (
                  <button type="button" key={p.id} onClick={() => toggle(p.id)}
                    className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition",
                      on ? "border-primary bg-primary-soft text-primary" : "border-border bg-background hover:bg-accent")}>
                    <Avatar name={p.full_name} size="xs" />{p.full_name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-md border border-border bg-surface px-3 text-sm hover:bg-accent">Cancel</button>
          <button type="submit" disabled={saving} className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-dark disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
        </div>
        <style>{`.input{height:2.25rem;width:100%;border:1px solid hsl(var(--border));border-radius:.375rem;background:hsl(var(--background));padding:0 .75rem;font-size:.875rem;outline:none}.input:focus{border-color:hsl(var(--primary));box-shadow:0 0 0 2px hsl(var(--primary)/.15)}`}</style>
      </form>
    </div>
  );
}
