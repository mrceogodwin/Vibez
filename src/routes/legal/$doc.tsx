import { createFileRoute, Link } from "@tanstack/react-router";
import { AppFrame } from "@/components/vibez/frame";

const docs: Record<string, { title: string; body: string[] }> = {
  terms: {
    title: "Terms of Service",
    body: [
      "Vibez is an entertainment discovery and promotion platform. Creating an account means you will use it lawfully and you will not upload material you do not have rights to share.",
      "A role such as artist, organiser, advertiser or community owner does not by itself grant a publishing permission. Commercial tools stay closed until the relevant profile is approved.",
      "Sample catalogue entries are demonstration content. They are not offers to sell tickets or to stream a recording.",
    ],
  },
  privacy: {
    title: "Privacy",
    body: [
      "Vibez stores the account details you submit, your preferences, and the records needed to sell tickets and run campaigns.",
      "Community tools do not ask for member phone numbers and Vibez does not scrape private groups.",
      "Ticket QR codes identify a ticket. They do not contain card or payment details.",
    ],
  },
  refunds: {
    title: "Refunds",
    body: [
      "Each live event publishes its own refund policy before tickets go on sale.",
      "If a payment is confirmed and the tickets have sold out, the order is marked for a refund review and no ticket is issued.",
      "Sample listings cannot be purchased.",
    ],
  },
  advertising: {
    title: "Advertising guidelines",
    body: [
      "Campaigns are reviewed before they run. Approval is separate from payment.",
      "Live advertisements are labelled Sponsored.",
      "Reported impressions and clicks come from recorded events on Vibez.",
    ],
  },
  music: {
    title: "Music submission terms",
    body: [
      "You confirm you have the rights to promote the material you submit.",
      "Vibez does not assume it owns an uploaded recording and does not offer unrestricted streaming.",
      "A paid placement is labelled Sponsored only after editorial approval. Payment does not force approval.",
    ],
  },
  community: {
    title: "Community promotion guidelines",
    body: [
      "Community owners keep control of their audiences. They can decline a campaign.",
      "Do not upload private member lists. Do not promise streams or followers.",
      "Payouts to community owners are not enabled. Vibez will not pretend a balance can be withdrawn.",
    ],
  },
  copyright: {
    title: "Copyright and takedown",
    body: [
      "If you believe something on Vibez infringes a right you hold, write to the address published with this policy and include the URL, your contact details, and a description of the work.",
      "Vibez can unpublish a submission, event or campaign while it reviews a report.",
    ],
  },
};

export const Route = createFileRoute("/legal/$doc")({
  component: LegalPage,
});

function LegalPage() {
  const { doc } = Route.useParams();
  const page = docs[doc];
  return (
    <AppFrame>
      {page ? (
        <article className="panel">
          <h1>{page.title}</h1>
          {page.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </article>
      ) : <div className="empty"><h2>Not found</h2><Link className="btn" to="/legal/$doc" params={{ doc: "terms" }}>Terms</Link></div>}
      <div className="app-chips">
        {Object.keys(docs).map((key) => (
          <Link key={key} to="/legal/$doc" params={{ doc: key }} className={key === doc ? "app-chip is-on" : "app-chip"}>{docs[key].title}</Link>
        ))}
      </div>
    </AppFrame>
  );
}
