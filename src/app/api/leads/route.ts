import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "../../../../db";
import { leads } from "../../../../db/schema";
import { leadSchema, STATUSES } from "@/lib/validation";
import { errorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/leads?search=&status=&event=
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const search = sp.get("search")?.trim();
    const status = sp.get("status");
    const event = sp.get("event")?.trim();

    const filters: (SQL | undefined)[] = [];
    if (search) {
      const pattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
      filters.push(
        or(
          ilike(leads.name, pattern),
          ilike(leads.company, pattern),
          ilike(leads.email, pattern),
          ilike(leads.notes, pattern)
        )
      );
    }
    if (status && (STATUSES as readonly string[]).includes(status)) {
      filters.push(eq(leads.status, status));
    }
    if (event) filters.push(eq(leads.event, event));

    const [rows, events] = await Promise.all([
      db.select().from(leads).where(and(...filters)).orderBy(desc(leads.updatedAt)),
      db.selectDistinct({ event: leads.event }).from(leads).orderBy(asc(leads.event)),
    ]);

    return NextResponse.json({ leads: rows, events: events.map((e) => e.event) });
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/leads
export async function POST(req: NextRequest) {
  try {
    const data = leadSchema.parse(await req.json());
    const [lead] = await db.insert(leads).values(data).returning();
    return NextResponse.json(lead, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
