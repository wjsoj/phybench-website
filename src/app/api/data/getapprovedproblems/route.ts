import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag") || undefined;
  const status = searchParams.get("status") || undefined;
  const translatedStatus = searchParams.get("translatedStatus") || undefined;
  const nominated = searchParams.get("nominated") || undefined;
  const aiPerformancesParam = searchParams.get("aiPerformances") || undefined;
  const fieldsParam = searchParams.get("fields") || "";

  // Build the basic filter (where) clause.
  const where: any = {
    ...(status ? { status } : {}),
    ...(tag ? { tag } : {}),
    ...(translatedStatus ? { translatedStatus } : {}),
    ...(nominated ? { nominated } : {}),
  };

  // If aiPerformances filter equals "0", return only problems with no aiPerformances.
  if (aiPerformancesParam === "0") {
    where.aiPerformances = { none: {} };
  }

  // Default select object – these fields are always returned.
  const select: any = {
    id: true,
    content: true,
    solution: true,
    answer: true,
  };

  // Allowed additional fields.
  const allowedFields = new Set([
    "tag",
    "status",
    "translatedStatus",
    "nominated",
    "translatedContent",
    "translatedSolution",
    "variables",
    "aiPerformances",
  ]);

  // Build the additional selection dynamically.
  if (fieldsParam) {
    const fields = fieldsParam.split(",").map((f) => f.trim());
    fields.forEach((field) => {
      if (allowedFields.has(field)) {
        select[field] = true;
      }
    });
  }

  try {
    const problems = await prisma.problem.findMany({
      where,
      select,
    });
    return NextResponse.json(problems);
  } catch (error: any) {
    console.error("Error fetching problems:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
