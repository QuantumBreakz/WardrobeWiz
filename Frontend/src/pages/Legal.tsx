import SitePageTemplate from "./site/SitePageTemplate";

const sections = [
  {
    title: "Status",
    description: "wardrobewiz is in prototype mode. These legal pages act as placeholders until lawyers review the stack.",
  },
  {
    title: "Data handling",
    description: "All wardrobe photos stay inside your browser during the mock phase. No uploads leave your device.",
  },
  {
    title: "Next steps",
    description: "Once the backend goes live, we’ll publish full privacy, terms, and security statements here.",
  },
];

const Legal = () => (
  <SitePageTemplate
    title="Legal"
    description="High-level statements about how we plan to secure and respect user data."
    sections={sections}
  />
);

export default Legal;

