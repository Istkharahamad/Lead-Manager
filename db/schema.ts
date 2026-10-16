import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";

export const leads = pgTable(
  "leads",
  {
    id: text().primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text().notNull(),
    company: text(),
    email: text().notNull(),
    event: text().notNull(),
    notes: text().notNull().default(""),
    status: text().notNull().default("NEW"),
    aiSummary: text("ai_summary"),
    followUpDraft: text("follow_up_draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("leads_status_idx").on(t.status), index("leads_event_idx").on(t.event)]
);

export type Lead = typeof leads.$inferSelect;
