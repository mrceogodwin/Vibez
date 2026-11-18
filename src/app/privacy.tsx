import { LegalScreen } from "@/screens/places";

const body =
  "Draft for legal review. Vibez stores your account, profile, and wallet records in Neon Postgres. Media will be stored in Cloudflare R2 when that is configured. We do not sell card details. Payment confirmation comes from Bachs or, if later enabled, Paystack. A full privacy policy, retention schedule, and age policy are still to be approved.";

export default function PrivacyRoute() {
  return <LegalScreen title="Privacy Policy" body={body} />;
}
