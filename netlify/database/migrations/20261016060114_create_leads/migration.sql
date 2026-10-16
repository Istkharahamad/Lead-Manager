CREATE TABLE "leads" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"company" text,
	"email" text NOT NULL,
	"event" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'NEW' NOT NULL,
	"ai_summary" text,
	"follow_up_draft" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" ("status");--> statement-breakpoint
CREATE INDEX "leads_event_idx" ON "leads" ("event");