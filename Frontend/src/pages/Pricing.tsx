import SitePageTemplate from "./site/SitePageTemplate";

const sections = [
  {
    title: "Starter (Free)",
    description: "Upload up to 50 garments, get daily outfit prompts, and share looks with friends.",
    bullets: ["Virtual try-on preview", "Basic analytics", "Email support"],
  },
  {
    title: "Studio (Coming soon)",
    description: "Unlimited garments, advanced analytics, and custom palettes for stylists.",
    bullets: ["Priority chat support", "Team collaboration", "Dedicated reviewer portal"],
  },
  {
    title: "Enterprise",
    description: "Tailored engagement for brands or universities. Book a call once we're live with the backend.",
  },
];

const Pricing = () => (
  <SitePageTemplate
    title="Pricing"
    description="Transparent tiers for early adopters. Everything here is mock copy until payments launch."
    sections={sections}
  />
);

export default Pricing;

