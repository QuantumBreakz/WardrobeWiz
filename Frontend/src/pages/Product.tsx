import SitePageTemplate from "./site/SitePageTemplate";

const sections = [
  {
    title: "Capture studio",
    description: "Guided overlays, automatic background cleanup, and textile tagging so every garment photo is future-proof.",
    bullets: ["Camera hints", "Lighting indicators", "One-tap metadata"],
  },
  {
    title: "Virtual try-on",
    description: "Layer your actual garments on an avatar that mirrors your measurements, weather, and mood.",
    bullets: ["Scenario presets", "Palette suggestions", "Feedback buttons"],
  },
  {
    title: "Explain & refine",
    description: "Plain-language summaries clarify why each look works and how to tweak it.",
  },
];

const Product = () => (
  <SitePageTemplate
    title="Product overview"
    description="A virtual wardrobe cockpit that captures garments, mixes outfits, and keeps learning from your feedback."
    sections={sections}
  />
);

export default Product;

