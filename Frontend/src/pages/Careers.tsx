import SitePageTemplate from "./site/SitePageTemplate";

const sections = [
  {
    title: "Why join",
    description: "Help us turn a Final Year Project into a production-ready platform that reimagines wardrobes.",
  },
  {
    title: "Roles (future)",
    description: "AI researcher, front-end engineer, product designer, sustainability analyst.",
  },
  {
    title: "How to apply",
    description: "Send your portfolio or GitHub once we publish the backend roadmap. For now, contribute feedback via the mock UI.",
  },
];

const Careers = () => (
  <SitePageTemplate
    title="Careers"
    description="We’re not hiring yet, but here’s the plan for when we open wardrobewiz beyond the classroom."
    sections={sections}
  />
);

export default Careers;

