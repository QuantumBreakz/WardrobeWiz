import SitePageTemplate from "./site/SitePageTemplate";

const sections = [
  {
    title: "During prototype",
    description: "We do not collect or transmit wardrobe images. Everything stays local unless you export or share manually.",
  },
  {
    title: "Future roadmap",
    description: "When a backend exists, we’ll encrypt garment assets, support data deletion, and comply with local privacy laws.",
  },
  {
    title: "Your control",
    description: "Delete items, reset the mock data, or opt out of analytics at any time—these buttons will appear once APIs land.",
  },
];

const Privacy = () => (
  <SitePageTemplate
    title="Privacy"
    description="Placeholder policy describing how we intend to treat user data."
    sections={sections}
  />
);

export default Privacy;

