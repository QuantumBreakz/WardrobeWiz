import SitePageTemplate from "./site/SitePageTemplate";

const sections = [
  {
    title: "Who we are",
    description: "Final Year Project builders focused on merging AI, sustainability, and user delight.",
  },
  {
    title: "What we’re exploring",
    description: "Multimodal perception, retrieval-augmented generation, and reinforcement learning for personal styling.",
  },
  {
    title: "How to contribute",
    description: "Share feedback, test the mock flows, or help with the upcoming backend integration.",
  },
];

const About = () => (
  <SitePageTemplate
    title="About wardrobewiz"
    description="A quick overview for anyone evaluating the project or curious about the team."
    sections={sections}
  />
);

export default About;

