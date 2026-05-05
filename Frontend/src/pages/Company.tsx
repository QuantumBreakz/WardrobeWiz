import SitePageTemplate from "./site/SitePageTemplate";

const sections = [
  {
    title: "Mission",
    description: "Unlock creativity inside every wardrobe while keeping sustainability front and center.",
  },
  {
    title: "Values",
    description: "Radical clarity, research-backed experimentation, and empathy for both end users and evaluators.",
    bullets: ["Transparency", "Delight", "Impact"],
  },
  {
    title: "Roadmap",
    description: "Phase 1: nail the front-end flows. Phase 2: integrate the real AI stack. Phase 3: open to beta testers.",
  },
];

const Company = () => (
  <SitePageTemplate
    title="Company"
    description="A fast-moving team building wardrobewiz for FAST-NUCES and beyond."
    sections={sections}
  />
);

export default Company;

