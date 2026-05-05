import SitePageTemplate from "./site/SitePageTemplate";

const sections = [
  {
    title: "Latest posts",
    description: "We’ll document progress, publish experiments, and recap demo learnings once the backend work kicks off.",
  },
  {
    title: "Topics we cover",
    description: "Wardrobe management, AI explainability, sustainability frameworks, and project retrospectives.",
  },
  {
    title: "Get featured",
    description: "Contribute a guest post if you’ve run your own wardrobe experiments or discovered a unique styling insight.",
  },
];

const Blog = () => (
  <SitePageTemplate
    title="Blog"
    description="A future home for updates, essays, and technical write-ups."
    sections={sections}
  />
);

export default Blog;

