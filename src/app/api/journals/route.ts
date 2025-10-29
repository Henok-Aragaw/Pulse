import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const headerList = await headers();
    const session = await auth.api.getSession({ headers: headerList });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const journals = await prisma.journal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(journals);
  } catch (error: unknown) {
    console.error("Error fetching journals:", error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to fetch journals", details },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const headerList = await headers();
    const session = await auth.api.getSession({ headers: headerList });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, mood, summary, advice } = await req.json();

    if (!text || !mood || !summary || !advice) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const journal = await prisma.journal.create({
      data: {
        userId: session.user.id,
        text,
        mood,
        summary,
        advice,
      },
    });

    return NextResponse.json(journal);
  } catch (error: unknown) {
    console.error("Error saving journal:", error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to save journal", details },
      { status: 500 }
    );
  }
}
