import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.redirect("https://www.youtube.com/channel/UCVBbBFD9HHLNkQoGg1nszsw", 307);
}
