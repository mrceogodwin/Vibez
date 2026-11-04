# Vibez

**Events · Tickets · Experiences**

Vibez is a Nigeria-first event discovery and ticketing platform, with organiser tools and an authorised past-event media marketplace.

## Stack
- Next.js App Router + TypeScript
- Neon PostgreSQL
- Prisma ORM
- Paystack (planned for ticket checkout)
- Vercel hosting

## Local development
1. Install Node.js 20.9+.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and add your Neon connection string.
4. Run `npx prisma generate`.
5. Run `npm run dev`.

## Product principles
- Customer checkout happens on Vibez by default.
- Tickets are issued only after server-side payment verification.
- Past events remain archived; admission sales stop when the event has ended.
- Media is monetised only when the uploader has the necessary rights.
- Organiser settlements, platform commissions, refunds and payment fees are recorded separately.

## Current milestone
Public homepage design foundation and initial event/order/ticket data models. Authentication, live event data, payment processing, organiser workflows and admin controls are not yet enabled.
