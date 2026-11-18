import { LegalScreen } from "@/screens/places";

const body =
  "Draft for legal review. Vibez is a social entertainment service. Creating an account means you will follow the platform rules once they are published. Ordinary social features are not gated on Vibez Plus. This draft is not a finished legal agreement.";

export default function TermsRoute() {
  return <LegalScreen title="Terms of Service" body={body} />;
}
