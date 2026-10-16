"use client";

import { useCallback, useEffect, useState } from "react";

type Status = "NEW" | "CONTACTED" | "REPLIED" | "MEETING_SCHEDULED" | "CLOSED";

type Lead = {
  id: string;
  name: string;
  company: string | null;
  email: string;
  event: string;
  notes: string;
  status: Status;
  aiSummary: string | null;
  followUpDraft: string | null;
  updatedAt: string;
};

const STATUS_META: Record<Status, { label: string; cls: string }> = {
  NEW: { label: "New", cls: "bg-teal-soft text-teal-dark" },
  CONTACTED: { label: "Contacted", cls: "bg-amber-soft text-amber" },
  REPLIED: { label: "Replied", cls: "bg-sky-100 text-sky-800" },
  MEETING_SCHEDULED: { label: "Meeting set", cls: "bg-violet-100 text-violet-800" },
  CLOSED: { label: "Closed", cls: "bg-stone-200 text-stone-700" },
};
const STATUS_LIST = Object.keys(STATUS_META) as Status[];

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

function StatusBadge({ status }: { status: Status }) {
  const m = STATUS_META[status];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${m.cls}`}>{m.label}</span>;
}

export default function LeadApp() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("");
  const [event, setEvent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formLead, setFormLead] = useState<Lead | "new" | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Lead | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (debounced) qs.set("search", debounced);
      if (status) qs.set("status", status);
      if (event) qs.set("event", event);
      const data = await api<{ leads: Lead[]; events: string[] }>(`/api/leads?${qs}`);
      setLeads(data.leads);
      setEvents(data.events);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [debounced, status, event]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = leads.find((l) => l.id === selectedId) ?? null;
  const replaceLead = (l: Lead) => setLeads((prev) => prev.map((x) => (x.id === l.id ? l : x)));

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await api(`/api/leads/${toDelete.id}`, { method: "DELETE" });
      if (selectedId === toDelete.id) setSelectedId(null);
      notify("Lead deleted");
      setToDelete(null);
      load();
    } catch (e) {
      setError((e as Error).message);
      setToDelete(null);
    }
  }

  const totalCount = leads.length;
  const meetingsScheduled = leads.filter((l) => l.status === "MEETING_SCHEDULED").length;
  const contactedOrReplied = leads.filter((l) => ["CONTACTED", "REPLIED", "MEETING_SCHEDULED"].includes(l.status)).length;
  const followUpRate = totalCount > 0 ? Math.round((contactedOrReplied / totalCount) * 100) : 0;

  function exportCSV() {
    if (leads.length === 0) return;
    const headers = ["Name", "Company", "Email", "Event", "Status", "Notes", "AI Summary"];
    const rows = leads.map((l) => [
      `"${l.name.replace(/"/g, '""')}"`,
      `"${(l.company || "").replace(/"/g, '""')}"`,
      `"${l.email.replace(/"/g, '""')}"`,
      `"${l.event.replace(/"/g, '""')}"`,
      `"${l.status}"`,
      `"${(l.notes || "").replace(/"/g, '""')}"`,
      `"${(l.aiSummary || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `even8-event-leads-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify("Exported leads to CSV");
  }

  const filtersActive = Boolean(debounced || status || event);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Event leads</h1>
            <span className="rounded-full bg-teal-soft px-2.5 py-0.5 text-xs font-semibold text-teal-dark">AI-Native</span>
          </div>
          <p className="mt-1 text-muted">Capture event conversations, measure pipeline impact, and automate follow-ups.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="btn-ghost" onClick={exportCSV} title="Export leads as CSV">
            <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
          <button className="btn-primary" onClick={() => setFormLead("new")}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add lead
          </button>
        </div>
      </header>

      {/* Impact & Pipeline Metrics */}
      <section aria-label="Event Pipeline Metrics" className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">Leads Captured</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ink">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">Follow-Up Rate</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-teal">{followUpRate}%</p>
        </div>
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">Meetings Set</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-violet-700">{meetingsScheduled}</p>
        </div>
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">Events Tracked</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-amber">{events.length}</p>
        </div>
      </section>

      {/* Quick Status Filter Tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5 border-b border-line pb-3">
        <button
          onClick={() => setStatus("")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            status === "" ? "bg-ink text-white" : "bg-white text-muted hover:bg-paper hover:text-ink"
          }`}
        >
          All ({totalCount})
        </button>
        {STATUS_LIST.map((s) => {
          const count = leads.filter((l) => l.status === s).length;
          const active = status === s;
          return (
            <button
              key={s}
              onClick={() => setStatus(active ? "" : s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                active ? "bg-ink text-white" : "bg-white text-muted hover:bg-paper hover:text-ink"
              }`}
            >
              {STATUS_META[s].label} ({count})
            </button>
          );
        })}
      </div>

      <section aria-label="Filters" className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <input
          className="input"
          type="search"
          placeholder="Search name, company, email, notes"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search leads"
        />
        <select className="input sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUS_LIST.map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
        <select className="input sm:w-56" value={event} onChange={(e) => setEvent(e.target.value)} aria-label="Filter by event">
          <option value="">All events</option>
          {events.map((ev) => (
            <option key={ev} value={ev}>{ev}</option>
          ))}
        </select>
      </section>

      {error && (
        <div role="alert" className="mb-4 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>{error}</span>
          <button className="underline" onClick={load}>Retry</button>
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-muted">Loading leads…</p>
      ) : leads.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line py-16 text-center">
          <p className="font-medium">{filtersActive ? "No leads match these filters" : "No leads yet"}</p>
          <p className="mt-1 text-sm text-muted">
            {filtersActive ? "Clear the search or filters to see everyone." : "Add the first person you met at an event."}
          </p>
          {!filtersActive && (
            <button className="btn-primary mt-4" onClick={() => setFormLead("new")}>Add lead</button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-lg border border-line bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-paper text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-t border-line hover:bg-paper/60">
                    <td className="px-4 py-3">
                      <button className="text-left font-medium hover:underline" onClick={() => setSelectedId(l.id)}>{l.name}</button>
                      <div className="text-muted">{l.email}</div>
                    </td>
                    <td className="px-4 py-3">{l.company ?? "—"}</td>
                    <td className="px-4 py-3">{l.event}</td>
                    <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <button className="px-2 py-1 text-teal hover:underline" onClick={() => setFormLead(l)}>Edit</button>
                      <button className="px-2 py-1 text-red-700 hover:underline" onClick={() => setToDelete(l)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="grid gap-3 md:hidden">
            {leads.map((l) => (
              <li key={l.id} className="rounded-lg border border-line bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <button className="text-left font-semibold" onClick={() => setSelectedId(l.id)}>{l.name}</button>
                  <StatusBadge status={l.status} />
                </div>
                <p className="text-sm text-muted">{l.company ?? "No company"} · {l.event}</p>
                <p className="mt-1 text-sm text-muted">{l.email}</p>
                <div className="mt-3 flex gap-2">
                  <button className="btn-ghost" onClick={() => setSelectedId(l.id)}>Open</button>
                  <button className="btn-ghost" onClick={() => setFormLead(l)}>Edit</button>
                  <button className="btn-ghost text-red-700" onClick={() => setToDelete(l)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {formLead && (
        <LeadForm
          lead={formLead === "new" ? null : formLead}
          knownEvents={events}
          onClose={() => setFormLead(null)}
          onSaved={(msg) => {
            setFormLead(null);
            notify(msg);
            load();
          }}
        />
      )}

      {selected && (
        <LeadDrawer
          lead={selected}
          onClose={() => setSelectedId(null)}
          onUpdate={replaceLead}
          onEdit={() => setFormLead(selected)}
          notify={notify}
        />
      )}

      {toDelete && (
        <Modal onClose={() => setToDelete(null)} title="Delete this lead?">
          <p className="text-sm text-muted">
            {toDelete.name} and their notes will be removed permanently.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setToDelete(null)}>Keep lead</button>
            <button className="btn-danger" onClick={confirmDelete}>Delete lead</button>
          </div>
        </Modal>
      )}

      {toast && (
        <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-md bg-ink px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-xl bg-white p-5 sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function LeadForm({
  lead, knownEvents, onClose, onSaved,
}: {
  lead: Lead | null;
  knownEvents: string[];
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    name: lead?.name ?? "",
    company: lead?.company ?? "",
    email: lead?.email ?? "",
    event: lead?.event ?? "",
    notes: lead?.notes ?? "",
    status: (lead?.status ?? "NEW") as Status,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      if (lead) {
        await api(`/api/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify(form) });
        onSaved("Lead saved");
      } else {
        await api("/api/leads", { method: "POST", body: JSON.stringify(form) });
        onSaved("Lead added");
      }
    } catch (e) {
      setErr((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <Modal title={lead ? "Edit lead" : "Add lead"} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-3">
        <label className="grid gap-1 text-sm">Name
          <input className="input" required value={form.name} onChange={set("name")} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">Company
            <input className="input" value={form.company} onChange={set("company")} />
          </label>
          <label className="grid gap-1 text-sm">Email
            <input className="input" type="email" required value={form.email} onChange={set("email")} />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">Event
            <input className="input" required list="event-options" value={form.event} onChange={set("event")} />
            <datalist id="event-options">{knownEvents.map((ev) => <option key={ev} value={ev} />)}</datalist>
          </label>
          <label className="grid gap-1 text-sm">Follow-up status
            <select className="input" value={form.status} onChange={set("status")}>
              {STATUS_LIST.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          </label>
        </div>
        <label className="grid gap-1 text-sm">Notes
          <textarea className="input min-h-28" value={form.notes} onChange={set("notes")} placeholder="What did you talk about? Pain points, timing, who else is involved…" />
        </label>
        {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save lead"}</button>
        </div>
      </form>
    </Modal>
  );
}

function LeadDrawer({
  lead, onClose, onUpdate, onEdit, notify,
}: {
  lead: Lead;
  onClose: () => void;
  onUpdate: (l: Lead) => void;
  onEdit: () => void;
  notify: (m: string) => void;
}) {
  const [busy, setBusy] = useState<"summarize" | "follow-up" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [draft, setDraft] = useState(lead.followUpDraft ?? "");

  useEffect(() => setDraft(lead.followUpDraft ?? ""), [lead.followUpDraft]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function run(kind: "summarize" | "follow-up") {
    setBusy(kind);
    setErr(null);
    try {
      onUpdate(await api<Lead>(`/api/leads/${lead.id}/${kind}`, { method: "POST" }));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function changeStatus(s: Status) {
    try {
      onUpdate(await api<Lead>(`/api/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify({ status: s }) }));
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft);
      notify("Copied to clipboard");
    } catch {
      notify("Couldn't copy. Select the text and copy manually.");
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink/40" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Lead details for ${lead.name}`}
        className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{lead.name}</h2>
            <p className="text-sm text-muted">{lead.company ?? "No company"} · {lead.event}</p>
            <a className="text-sm text-teal hover:underline" href={`mailto:${lead.email}`}>{lead.email}</a>
          </div>
          <button className="btn-ghost" onClick={onClose} aria-label="Close details">Close</button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <label htmlFor="status" className="text-sm text-muted">Status</label>
          <select id="status" className="input w-auto" value={lead.status} onChange={(e) => changeStatus(e.target.value as Status)}>
            {STATUS_LIST.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </select>
          <button className="btn-ghost ml-auto" onClick={onEdit}>Edit</button>
        </div>

        <h3 className="mt-6 text-sm font-semibold">Notes</h3>
        <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{lead.notes || "No notes yet."}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button className="btn-primary" disabled={!!busy || !lead.notes.trim()} onClick={() => run("summarize")}>
            {busy === "summarize" ? "Summarizing…" : lead.aiSummary ? "Re-summarize notes" : "Summarize notes"}
          </button>
          <button className="btn-ghost" disabled={!!busy} onClick={() => run("follow-up")}>
            {busy === "follow-up" ? "Drafting…" : lead.followUpDraft ? "Redraft follow-up" : "Draft follow-up"}
          </button>
        </div>
        {!lead.notes.trim() && <p className="mt-2 text-xs text-muted">Add notes to enable summaries.</p>}
        {err && <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{err}</p>}

        {lead.aiSummary && (
          <section className="mt-6">
            <h3 className="text-sm font-semibold">AI summary</h3>
            <p className="mt-1 whitespace-pre-wrap rounded-md bg-teal-soft p-3 text-sm">{lead.aiSummary}</p>
          </section>
        )}

        {lead.followUpDraft && (
          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Follow-up draft</h3>
              <button className="text-sm text-teal hover:underline" onClick={copy}>Copy</button>
            </div>
            <textarea
              className="input mt-1 min-h-48"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Follow-up draft, editable"
            />
            <p className="mt-1 text-xs text-muted">Edit freely before copying. Edits here aren't saved.</p>
          </section>
        )}
      </aside>
    </div>
  );
}
