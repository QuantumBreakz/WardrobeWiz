import SitePageTemplate from "./site/SitePageTemplate";

const sections = [
  {
    title: "Context-aware recommendations",
    description: "Blend wardrobe history, weather APIs, and your mood selections to suggest outfits that make sense.",
  },
  {
    title: "Explainer chat",
    description: "Ask why a piece was chosen, request alternatives, or save notes for later—all in one conversational pane.",
  },
  {
    title: "Sustainability nudges",
    description: "Track rewear percentage, donation prompts, and smart alerts when garments sit idle.",
  },
];

const FeaturesPage = () => (
  <SitePageTemplate
    title="Key features"
    description="Everything bundled into wardrobewiz today, kept front-end only until the backend is ready."
    sections={sections}
  />
);

export default FeaturesPage;

