import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Check,
  X,
  Plus,
  Search,
  Send,
  Loader2,
  Users,
  Globe,
  User as UserIcon,
  Pencil,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { PageHeader } from "@/components/hrms/PageHeader";
import { Avatar } from "@/components/hrms/Avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  messageService,
  type Conversation,
  type Message,
  type EmployeeOption,
} from "@/services/messageservice";

export const Route = createFileRoute("/_app/messages")({
  component: MessagesPage,
  head: () => ({
    meta: [
      { title: "Messages · TirthInfotech" },
      { name: "description", content: "Direct messages, group chats and company-wide conversations." },
    ],
  }),
});

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(iso).toLocaleDateString();
}

function ConversationIcon({ type }: { type: Conversation["conversation_type"] }) {
  if (type === "EVERYONE") return <Globe className="h-4 w-4" />;
  if (type === "GROUP") return <Users className="h-4 w-4" />;
  return <UserIcon className="h-4 w-4" />;
}

// Portal helper: mounts children directly under document.body so nothing in
// the component tree (transformed/overflow-clipped/stacking-context
// ancestors) can prevent the dialog from painting on top — this is what was
// causing the "backdrop shows, dialog invisible" bug on Android.
function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

function MessagesPage() {
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();
  const isMobile = useIsMobile();

  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [showNewConvo, setShowNewConvo] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: convLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: messageService.getConversations,
    refetchInterval: 5000,
  });

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => c.display_name.toLowerCase().includes(q));
  }, [conversations, search]);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  const { data: messagesPage, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", activeId],
    queryFn: () => messageService.getMessages(activeId as number),
    enabled: activeId !== null,
    refetchInterval: 4000,
  });

  const messages = messagesPage?.results ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, activeId]);

  const sendMut = useMutation({
    mutationFn: (text: string) => messageService.sendMessage(activeId as number, text),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["messages", activeId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Failed to send message"),
  });

  const editMut = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) =>
      messageService.editMessage(id, text),
    onSuccess: () => {
      setEditingMessage(null);
      qc.invalidateQueries({ queryKey: ["messages", activeId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Failed to edit message"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => messageService.deleteMessage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages", activeId] }),
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Failed to delete message"),
  });

  const createConvoMut = useMutation({
    mutationFn: async (payload:
      | { type: "DIRECT"; receiverId: number }
      | { type: "GROUP"; participantIds: number[]; name?: string }
      | { type: "EVERYONE" }) => {
      if (payload.type === "DIRECT") return messageService.createDirectConversation(payload.receiverId);
      if (payload.type === "GROUP")
        return messageService.createGroupConversation(payload.participantIds, payload.name);
      return messageService.createEveryoneConversation();
    },
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      setActiveId(conv.id);
      setShowNewConvo(false);
      toast.success("Conversation ready");
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Failed to create conversation"),
  });

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !activeId) return;
    sendMut.mutate(text);
  };

  const chatPanel = activeConversation && (
    <>
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        {isMobile && (
          <button
            onClick={() => setActiveId(null)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <Avatar name={activeConversation.display_name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-foreground">
            {activeConversation.display_name}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {activeConversation.participants.length} participant
            {activeConversation.participants.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className={cn("flex-1 space-y-3 overflow-y-auto overscroll-contain", isMobile ? "px-3 py-3" : "p-4")}
      >
        {messagesLoading ? (
          <div className="grid place-items-center py-16 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_id === me?.employeeId;
            return (
              <div
                key={m.id}
                className={cn("group flex items-end gap-2", isMine ? "flex-row-reverse" : "")}
              >
                {!isMine && <Avatar name={m.sender_name} size="sm" />}
                <div className={cn(isMobile ? "max-w-[80%]" : "max-w-[65%]", isMine ? "items-end" : "items-start")}>
                  {!isMine && (
                    <div className="mb-0.5 px-1 text-[11px] font-medium text-muted-foreground">
                      {m.sender_name}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    {isMine && !m.is_deleted && (
                      <div className="hidden items-center gap-1 group-hover:flex">
                        <button
                          onClick={() => {
                            setEditingMessage(m);
                            setEditDraft(m.message);
                          }}
                          className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-accent"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => deleteMut.mutate(m.id)}
                          className="grid h-6 w-6 place-items-center rounded text-danger hover:bg-danger-soft"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <div
                      className={cn(
                        "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                        isMine
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent text-foreground",
                        m.is_deleted && "italic opacity-60",
                      )}
                    >
                      {m.message}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "mt-0.5 px-1 text-[10px] text-muted-foreground",
                      isMine ? "text-right" : "text-left",
                    )}
                  >
                    {timeAgo(m.created_at)}
                    {m.is_edited && !m.is_deleted && " · edited"}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div
        className={cn(
          "flex items-center gap-2 border-t border-border bg-surface p-3",
          isMobile && "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        )}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message…"
          className="h-10 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || sendMut.isPending}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground hover:bg-primary-dark disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </>
  );

  const conversationList = (
    <>
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="h-10 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {convLoading ? (
          <div className="grid place-items-center py-16 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          <div className={cn(isMobile && "space-y-1 p-2")}>
            {filteredConversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={cn(
                  "flex w-full items-start gap-3 text-left transition-colors hover:bg-accent/50",
                  isMobile
                    ? "rounded-xl border border-transparent px-3 py-3.5 active:bg-accent/60"
                    : "border-b border-border/60 px-3 py-3",
                  activeId === c.id && !isMobile && "bg-primary-soft",
                )}
              >
                <div className="relative shrink-0">
                  <Avatar name={c.display_name} size={isMobile ? "lg" : "md"} />
                  <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-surface text-muted-foreground">
                    <ConversationIcon type={c.conversation_type} />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {c.display_name}
                    </span>
                    {c.last_message && (
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {timeAgo(c.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-muted-foreground">
                      {c.last_message
                        ? `${c.last_message.sender_name.split(" ")[0]}: ${c.last_message.message}`
                        : "No messages yet"}
                    </span>
                    {c.unread_count > 0 && (
                      <span className="grid h-5 min-w-[20px] shrink-0 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* On mobile, once a chat is open it takes over the whole screen — no
          point rendering the page chrome underneath a full-screen overlay. */}
      {!(isMobile && activeConversation) &&
        (isMobile ? (
          // Compact, chat-app-style header for mobile — the generic
          // PageHeader (breadcrumbs + text-2xl title + description) was the
          // source of the "oversized header / wasted space" complaint.
          // Desktop keeps the original PageHeader untouched below.
          <div className="border-b border-border bg-surface px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
                Messages
              </h1>
              <button
                onClick={() => setShowNewConvo(true)}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:bg-primary-dark active:scale-[0.97]"
              >
                <Plus className="h-4 w-4" />
                New
              </button>
            </div>
          </div>
        ) : (
          <PageHeader
            title="Messages"
            description="Direct messages, group chats and company-wide conversations"
            breadcrumbs={[{ label: "Home" }, { label: "Messages" }]}
            actions={
              <button
                onClick={() => setShowNewConvo(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-dark"
              >
                <Plus className="h-4 w-4" />
                New conversation
              </button>
            }
          />
        ))}

      {isMobile ? (
        activeConversation ? (
          // Full-screen chat takeover — WhatsApp/Telegram style.
          <div className="fixed inset-0 z-40 flex h-[100dvh] flex-col bg-surface">
            {chatPanel}
          </div>
        ) : (
          // Full-bleed list — no inset border/rounded card/centered max-width,
          // so there's no wasted space around the list on small screens.
          <div className="flex h-[calc(100dvh-57px)] flex-col bg-surface">
            {conversationList}
          </div>
        )
      ) : (
        <div className="mx-auto flex h-[calc(100vh-160px)] max-w-[1440px] gap-4 px-6 py-6 lg:px-8">
          {/* Left panel */}
          <div className="flex w-[320px] shrink-0 flex-col rounded-xl border border-border bg-surface">
            {conversationList}
          </div>

          {/* Right panel */}
          <div className="flex flex-1 flex-col rounded-xl border border-border bg-surface">
            {!activeConversation ? (
              <div className="grid flex-1 place-items-center text-sm text-muted-foreground">
                Select a conversation to start messaging
              </div>
            ) : (
              chatPanel
            )}
          </div>
        </div>
      )}

      {/* Portal-mounted: fixes the Android bug where the dim backdrop showed
          but the dialog itself never painted (ancestor stacking context /
          overflow clipping between MessagesPage and document.body). */}
      {showNewConvo && (
        <ModalPortal>
          <NewConversationDialog
            onClose={() => setShowNewConvo(false)}
            onCreateDirect={(id) => createConvoMut.mutate({ type: "DIRECT", receiverId: id })}
            onCreateGroup={(ids, name) =>
              createConvoMut.mutate({ type: "GROUP", participantIds: ids, name })
            }
            onCreateEveryone={() => createConvoMut.mutate({ type: "EVERYONE" })}
            submitting={createConvoMut.isPending}
          />
        </ModalPortal>
      )}

      {editingMessage && (
        <ModalPortal>
          <div className="fixed inset-0 z-[70] grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-elevated)]">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">Edit message</h3>
                <button
                  onClick={() => setEditingMessage(null)}
                  className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <textarea
                rows={3}
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                className="w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setEditingMessage(null)}
                  className="h-9 rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    editingMessage && editMut.mutate({ id: editingMessage.id, text: editDraft.trim() })
                  }
                  disabled={!editDraft.trim() || editMut.isPending}
                  className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
                >
                  {editMut.isPending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}

function NewConversationDialog({
  onClose,
  onCreateDirect,
  onCreateGroup,
  onCreateEveryone,
  submitting,
}: {
  onClose: () => void;
  onCreateDirect: (receiverId: number) => void;
  onCreateGroup: (participantIds: number[], name?: string) => void;
  onCreateEveryone: () => void;
  submitting: boolean;
}) {
  const [tab, setTab] = useState<"INDIVIDUAL" | "GROUP" | "EVERYONE">("INDIVIDUAL");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [groupName, setGroupName] = useState("");

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employee-options"],
    queryFn: messageService.getEmployeeOptions,
  });

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return employees.filter((e: EmployeeOption) =>
      `${e.first_name} ${e.last_name} ${e.employee_code}`.toLowerCase().includes(q),
    );
  }, [employees, query]);

  const toggle = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-end bg-foreground/40 backdrop-blur-sm sm:place-items-center">
      <div className="flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-xl border border-border bg-surface shadow-[var(--shadow-elevated)] sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-semibold">New conversation</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-border px-4 pt-3">
          {(["INDIVIDUAL", "GROUP", "EVERYONE"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setSelected([]);
              }}
              className={cn(
                "shrink-0 rounded-t-md px-3 py-2 text-sm font-medium capitalize transition-colors",
                tab === t
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "EVERYONE" ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
                <Globe className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                Creates a conversation with every active user in the company —{" "}
                {employees.length} people.
              </p>
            </div>
          ) : (
            <>
              {tab === "GROUP" && (
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name (optional)"
                  className="mb-3 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              )}
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search people…"
                  className="h-10 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>

              {isLoading ? (
                <div className="grid place-items-center py-10 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <div className="max-h-72 space-y-1 overflow-y-auto">
                  {filtered.map((e: EmployeeOption) => {
                    const isSelected = selected.includes(e.id);
                    return (
                      <button
                        key={e.id}
                        onClick={() =>
                          tab === "INDIVIDUAL" ? onCreateDirect(e.id) : toggle(e.id)
                        }
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left hover:bg-accent/50",
                          isSelected && "bg-primary-soft",
                        )}
                      >
                        <Avatar name={`${e.first_name} ${e.last_name}`} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {e.first_name} {e.last_name}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {e.employee_code} · {e.role.toLowerCase()}
                          </div>
                        </div>
                        {tab === "GROUP" && isSelected && (
                          <Check className="h-4 w-4 shrink-0 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            onClick={onClose}
            className="h-9 rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-accent"
          >
            Cancel
          </button>
          {tab === "GROUP" && (
            <button
              onClick={() => onCreateGroup(selected, groupName || undefined)}
              disabled={selected.length < 2 || submitting}
              className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
            >
              {submitting ? "Creating…" : `Create group (${selected.length})`}
            </button>
          )}
          {tab === "EVERYONE" && (
            <button
              onClick={onCreateEveryone}
              disabled={submitting}
              className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create Everyone chat"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}