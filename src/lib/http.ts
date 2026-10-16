import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Consistent error shape: { error: string, details?: ... } */
export function errorResponse(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: err.issues[0]?.message ?? "Invalid input", details: err.flatten().fieldErrors },
      { status: 400 }
    );
  }
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json({ error: "Something went wrong on our side" }, { status: 500 });
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
