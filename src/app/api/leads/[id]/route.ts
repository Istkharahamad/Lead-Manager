import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../../db";
import { leads } from "../../../../../db/schema";
import { leadPatchSchema } from "@/lib/validation";
import { errorResponse, HttpError } from "@/lib/http";

type Ctx = { params: { id: string } };

export const dynamic = "force-dynamic";

async function findLead(id: string) {
  const [lead] = await db.select().from(leads).where(eq(leads.id, id));
  if (!lead) throw new HttpError(404, "Lead not found");
  return lead;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    return NextResponse.json(await findLead(params.id));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const data = leadPatchSchema.parse(await req.json());
    const existing = await findLead(params.id);

    // If notes change, saved AI output is stale, so clear it.
    const notesChanged = data.notes !== undefined && data.notes !== existing.notes;
    const [lead] = await db
      .update(leads)
      .set(notesChanged ? { ...data, aiSummary: null, followUpDraft: null } : data)
      .where(eq(leads.id, params.id))
      .returning();
    return NextResponse.json(lead);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const deleted = await db.delete(leads).where(eq(leads.id, params.id)).returning({ id: leads.id });
    if (deleted.length === 0) throw new HttpError(404, "Lead not found");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
