import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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

    const where: Prisma.LeadWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { company: { contains: search } },
        { email: { contains: search } },
        { notes: { contains: search } },
      ];
    }
    if (status && (STATUSES as readonly string[]).includes(status)) {
      where.status = status as unknown as Prisma.LeadWhereInput["status"];
    }
    if (event) where.event = event;

    const [leads, events] = await Promise.all([
      prisma.lead.findMany({ where, orderBy: { updatedAt: "desc" } }),
      prisma.lead.findMany({ select: { event: true }, distinct: ["event"], orderBy: { event: "asc" } }),
    ]);

    return NextResponse.json({ leads, events: events.map((e) => e.event) });
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/leads
export async function POST(req: NextRequest) {
  try {
    const data = leadSchema.parse(await req.json());
    const lead = await prisma.lead.create({ data });
    return NextResponse.json(lead, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
