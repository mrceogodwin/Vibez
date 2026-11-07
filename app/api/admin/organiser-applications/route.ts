import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { EventStatus, OrganizerApplicationStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const statuses = new Set(Object.values(OrganizerApplicationStatus));
function authorised(request: Request) {
  const expected = process.env.VIBEZ_ADMIN_KEY;
  const supplied = request.headers.get("x-vibez-admin-key") ?? "";
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected), b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}
const slugBase = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "organiser";

export async function GET(request: Request) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorised. Check the admin access key." }, { status: 401 });
  try {
    const applications = await prisma.organizerApplication.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    return NextResponse.json({ applications });
  } catch {
    return NextResponse.json({ error: "Could not load organiser applications. Check the database connection and Prisma schema." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorised. Check the admin access key." }, { status: 401 });
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const status = typeof body.status === "string" ? body.status : "";
    if (!id || !statuses.has(status as OrganizerApplicationStatus)) {
      return NextResponse.json({ error: "A valid application ID and status are required." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const application = await tx.organizerApplication.findUnique({ where: { id } });
      if (!application) throw new Error("APPLICATION_NOT_FOUND");

      if (status === OrganizerApplicationStatus.DECLINED) {
        const existing = await tx.user.findUnique({
          where: { email: application.email.toLowerCase() },
          select: { id: true, role: true, organizerProfile: { select: { id: true } } },
        });
        if (existing?.role === UserRole.ORGANIZER && existing.organizerProfile) {
          await tx.organizerProfile.update({
            where: { userId: existing.id },
            data: { verificationStatus: "DECLINED" },
          });
          await tx.event.updateMany({
            where: { organizerId: existing.id, status: EventStatus.PUBLISHED },
            data: { status: EventStatus.REJECTED },
          });
        }
      }

      if (status === OrganizerApplicationStatus.APPROVED) {
        const email = application.email.toLowerCase();
        let user = await tx.user.findUnique({ where: { email }, include: { organizerProfile: true } });
        if (user && user.role !== UserRole.ORGANIZER) throw new Error("EMAIL_ALREADY_REGISTERED");
        if (!user) {
          user = await tx.user.create({
            data: { email, name: application.contactName, role: UserRole.ORGANIZER },
            include: { organizerProfile: true },
          });
        }

        if (user.organizerProfile) {
          await tx.organizerProfile.update({
            where: { userId: user.id },
            data: {
              businessName: application.businessName,
              phone: application.phone,
              website: application.website,
              verificationStatus: "APPROVED",
            },
          });
        } else {
          const base = slugBase(application.businessName);
          let slug = base;
          let suffix = 2;
          while (await tx.organizerProfile.findUnique({ where: { slug }, select: { id: true } })) {
            slug = `${base}-${suffix++}`;
          }
          await tx.organizerProfile.create({
            data: {
              userId: user.id,
              businessName: application.businessName,
              slug,
              phone: application.phone,
              website: application.website,
              verificationStatus: "APPROVED",
            },
          });
        }
      }

      const updated = await tx.organizerApplication.update({
        where: { id },
        data: { status: status as OrganizerApplicationStatus },
      });
      return updated;
    });

    return NextResponse.json({
      application: result,
      message: status === OrganizerApplicationStatus.APPROVED
        ? "Application approved and organiser profile provisioned. Login access is not enabled until authentication is configured."
        : status === OrganizerApplicationStatus.DECLINED
          ? "Application declined. Any existing organiser verification was revoked and their published events were removed from public listings."
          : "Application status updated.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "APPLICATION_NOT_FOUND") {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "EMAIL_ALREADY_REGISTERED") {
      return NextResponse.json({ error: "This email already belongs to a non-organiser account. Resolve the account ownership before approving this application." }, { status: 409 });
    }
    return NextResponse.json({ error: "Application update failed. Confirm the record and database connection." }, { status: 500 });
  }
}
