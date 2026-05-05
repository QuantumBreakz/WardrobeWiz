import SitePageTemplate from "./site/SitePageTemplate";

const sections = [
  {
    title: "Is the backend live?",
    description: "Not yet. The entire experience is mocked on the front end so you can test flows, gather feedback, and prep Deliverable II.",
  },
  {
    title: "Can I import my closet automatically?",
    description: "For now, drag-and-drop photos or use the guided capture overlay. API integrations arrive once we connect the backend.",
  },
  {
    title: "How are recommendations generated?",
    description: "We describe a CLIP → FAISS → LLM architecture, but these responses are currently scripted. The UI is ready for real data later.",
  },
];

const FAQ = () => (
  <SitePageTemplate
    title="Frequently asked questions"
    description="Answers to the most common wardrobewiz questions while we finalize the infrastructure."
    sections={sections}
  />
);

export default FAQ;

