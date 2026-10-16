import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { leadPatchSchema } from "@/lib/validation";
import { errorResponse, HttpError } from "@/lib/http";

type Ctx = { params: { id: string } };

function notFound(err: unknown) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
    return new HttpError(404, "Lead not found");
  }
  return err;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!lead) throw new HttpError(404, "Lead not found");
    return NextResponse.json(lead);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const data = leadPatchSchema.parse(await req.json());
    const existing = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!existing) throw new HttpError(404, "Lead not found");

    // If notes change, saved AI output is stale, so clear it.
    const notesChanged = data.notes !== undefined && data.notes !== existing.notes;
    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: notesChanged ? { ...data, aiSummary: null, followUpDraft: null } : data,
    });
    return NextResponse.json(lead);
  } catch (err) {
    return errorResponse(notFound(err));
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await prisma.lead.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(notFound(err));
  }
}
