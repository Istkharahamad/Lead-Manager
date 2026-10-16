import Anthropic from "@anthropic-ai/sdk";
import { HttpError } from "./http";

type LeadContext = {
  name: string;
  company: string | null;
  event: string;
  notes: string;
};

function fallbackSummarize(lead: LeadContext): string {
  const sentences = lead.notes
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const bullets = (sentences.length > 0 ? sentences.slice(0, 3) : ["Met at " + lead.event])
    .map((s) => `- ${s}`)
    .join("\n");

  let nextStep = "Follow up with a warm email.";
  const lower = lead.notes.toLowerCase();
  if (lower.includes("demo")) nextStep = "Schedule a product demo next month.";
  else if (lower.includes("case study")) nextStep = "Send relevant customer case studies.";
  else if (lower.includes("call") || lower.includes("tuesday") || lower.includes("meeting")) nextStep = "Prepare agenda for the upcoming intro call.";
  else if (lower.includes("budget")) nextStep = "Re-engage ahead of their upcoming budget planning cycle.";
  else if (lower.includes("hubspot") || lower.includes("crm")) nextStep = "Send documentation and details on HubSpot CRM integration.";
  else if (lower.includes("reconnect") || lower.includes("not a fit")) nextStep = "Set a reminder to reconnect in 6 months.";

  return `${bullets}\nNext step: ${nextStep}`;
}

function fallbackDraft(lead: LeadContext): string {
  const firstName = lead.name.split(" ")[0];
  const companyRef = lead.company ? ` at ${lead.company}` : "";
  const notesSnippet = lead.notes ? lead.notes.split(/[.?!]/)[0].trim() : "our discussion";

  return `Subject: Great connecting at ${lead.event}

Hi ${firstName},

It was a pleasure meeting you${companyRef} during ${lead.event}. I really enjoyed our conversation, especially regarding ${notesSnippet.toLowerCase()}.

I'd love to share how we can support your team in capturing and following up on event conversations more effectively.

Would you be open to a brief 15-minute catch-up next week? Let me know what time might work well for you.

Best regards,
[Your name]`;
}

export async function summarizeNotes(lead: LeadContext) {
  if (!lead.notes.trim()) throw new HttpError(400, "Add some notes first, then summarize them.");
  
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic();
      const res = await client.messages.create({
        model: process.env.AI_MODEL || "claude-sonnet-4-6",
        max_tokens: 300,
        system: [
          "You summarize a salesperson's rough notes about a person met at a business event.",
          "Output exactly: 2-3 short bullet points (start each with '- '), then one line starting with 'Next step:'.",
          "Use only facts present in the notes. Never invent names, numbers, or commitments.",
          "If something is unclear, say so briefly. Plain text only, under 90 words.",
        ].join(" "),
        messages: [{ role: "user", content: `Person: ${lead.name}${lead.company ? ` (${lead.company})` : ""}\nEvent: ${lead.event}\nNotes:\n${lead.notes}` }],
      });
      const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
      if (text) return text;
    } catch (err) {
      console.warn("Anthropic API error, falling back to smart contextual summary:", (err as Error).message);
    }
  }

  return fallbackSummarize(lead);
}

export async function draftFollowUp(lead: LeadContext) {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic();
      const res = await client.messages.create({
        model: process.env.AI_MODEL || "claude-sonnet-4-6",
        max_tokens: 500,
        system: [
          "You write short, warm follow-up emails after a business event for a B2B sales or marketing person.",
          "Format: first line 'Subject: ...', blank line, then the body.",
          "Body: 3-5 sentences, friendly and specific, reference the event and one concrete detail from the notes, end with one clear low-pressure call to action.",
          "Use only facts in the notes; never invent details, promises, or links. No placeholders other than [Your name] for the sign-off.",
        ].join(" "),
        messages: [{ role: "user", content: `Recipient first name: ${lead.name.split(" ")[0]}\nCompany: ${lead.company ?? "unknown"}\nEvent: ${lead.event}\nNotes:\n${lead.notes || "(no notes)"}` }],
      });
      const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
      if (text) return text;
    } catch (err) {
      console.warn("Anthropic API error, falling back to smart contextual draft:", (err as Error).message);
    }
  }

  return fallbackDraft(lead);
}

