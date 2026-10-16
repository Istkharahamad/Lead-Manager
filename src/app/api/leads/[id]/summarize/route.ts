import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../../../db";
import { leads } from "../../../../../../db/schema";
import { summarizeNotes } from "@/lib/ai";
import { errorResponse, HttpError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [lead] = await db.select().from(leads).where(eq(leads.id, params.id));
    if (!lead) throw new HttpError(404, "Lead not found");
    const aiSummary = await summarizeNotes(lead);
    // Persist so we don't pay for the same call twice.
    const [updated] = await db.update(leads).set({ aiSummary }).where(eq(leads.id, lead.id)).returning();
    return NextResponse.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}
