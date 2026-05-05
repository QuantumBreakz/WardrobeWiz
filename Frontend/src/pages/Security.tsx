import SitePageTemplate from "./site/SitePageTemplate";

const sections = [
  {
    title: "Prototype safeguards",
    description: "No data leaves your device today. We mimic encryption and storage flows purely in the UI.",
  },
  {
    title: "Future controls",
    description: "Plan to encrypt wardrobe images at rest, rotate API keys automatically, and offer per-garment sharing permissions.",
  },
  {
    title: "Reporting issues",
    description: "Spot something suspicious? Ping the team before the backend goes live so we can bake security in early.",
  },
];

const Security = () => (
  <SitePageTemplate
    title="Security"
    description="Intentions for protecting wardrobe data once we move past the mock phase."
    sections={sections}
  />
);

export default Security;

