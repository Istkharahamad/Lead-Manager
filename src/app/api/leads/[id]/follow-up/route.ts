import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { draftFollowUp } from "@/lib/ai";
import { errorResponse, HttpError } from "@/lib/http";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!lead) throw new HttpError(404, "Lead not found");
    const followUpDraft = await draftFollowUp(lead);
    const updated = await prisma.lead.update({ where: { id: lead.id }, data: { followUpDraft } });
    return NextResponse.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}
