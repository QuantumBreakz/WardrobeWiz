import SitePageTemplate from "./site/SitePageTemplate";

const sections = [
  {
    title: "Usage",
    description: "wardrobewiz is for educational and demo purposes until otherwise stated. Don’t rely on it for commercial styling yet.",
  },
  {
    title: "Content ownership",
    description: "You own your wardrobe images and prompts. We only display them locally for demo purposes.",
  },
  {
    title: "Liability",
    description: "We’re not responsible for real-world wardrobe decisions made from this prototype. Use your judgment.",
  },
];

const Terms = () => (
  <SitePageTemplate
    title="Terms of use"
    description="Ground rules for using the wardrobewiz prototype."
    sections={sections}
  />
);

export default Terms;

