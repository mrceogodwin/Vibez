import { adCampaigns, type AdCampaign } from "@/lib/catalogue";

export function AdPlacementBanner({ placement }: { placement: AdCampaign["placement"] }) {
  const campaign = adCampaigns.find((item) => item.placement === placement && item.status === "active");
  if (!campaign) return null;
  return (
    <a className="vz-panel" href={campaign.href}>
      <p className="vz-kicker">Partner</p>
      <h2>{campaign.headline}</h2>
      <p className="vz-prose">{campaign.body}</p>
    </a>
  );
}
