import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.redirect("https://www.instagram.com/lernwerkfabrik/", 307);
}
