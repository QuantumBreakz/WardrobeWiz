import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/common/BackButton";
import { motion } from "framer-motion";

const layers = [
  {
    title: "Perception & Ingestion",
    detail: "Computer vision pipelines with background-agnostic object segmentation, CLIP ViT-L spatial embeddings, and rigorous metadata structuring.",
  },
  {
    title: "Latent Retrieval",
    detail: "High-dimensional FAISS HNSW indexing guarantees sub-50ms vector similarity search. Constrained by fit profiles, weather conditions, and wear telemetry.",
  },
  {
    title: "Synthesis & Orchestration",
    detail: "Agentic LLM chaining (Mixtral 8x7B / GPT-4o architecture) crafts hyper-personalized styling narratives, outputs deterministic JSON, and resolves combinatorial outfit spaces.",
  },
  {
    title: "Reinforcement Telemetry",
    detail: "Continuous learning loops. A multi-armed contextual bandit ingests explicit feedback and implicit dwell time to constantly reshape garment priors.",
  },
];

const stack = [
  {
    label: "Ingestion Engine",
    tools: ["React Native Core", "OpenCV Image Processing", "Segment Anything Model (SAM)"],
  },
  {
    label: "Inference Pipeline",
    tools: ["FastAPI Async Handlers", "CLIP ViT-L/14 Embeddings", "Distributed Worker Nodes"],
  },
  { label: "State & Vector Store", tools: ["FAISS HNSW Indexing", "Redis Tier-1 Cache", "S3 Blob Storage"] },
  { label: "Generative Orchestration", tools: ["LangChain Event Loop", "Deterministic LLM Parsing"] },
];

const Architecture = () => {
  return (
    <main className="min-h-screen pt-32 pb-24 px-4 sm:px-6 lg:px-12 relative z-10 mix-blend-difference">
      <section className="container mx-auto space-y-24">
        <BackButton className="mb-4 text-white" />
        
        <motion.header 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 max-w-5xl"
        >
          <p className="font-mono text-xs uppercase tracking-[0.5em] text-white/50">Core Infrastructure</p>
          <h1 className="text-6xl sm:text-8xl font-medium tracking-tight text-white leading-[1.1]">
            SYSTEM <br /> ARCHITECTURE.
          </h1>
          <p className="text-2xl font-light text-white/60 max-w-3xl leading-relaxed">
            A deterministic, low-latency pipeline bridging high-dimensional vector search with generative AI to solve the combinatorial complexity of modern wardrobing.
          </p>
        </motion.header>

        <div className="grid gap-0 lg:grid-cols-4 border-y border-white/20 divide-y lg:divide-y-0 lg:divide-x divide-white/20">
          {layers.map((layer, i) => (
            <motion.div 
              key={layer.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 space-y-6 hover:bg-white/[0.03] transition-colors group cursor-none"
            >
              <h3 className="font-mono text-sm uppercase tracking-widest text-white/80 group-hover:text-white transition-colors">{layer.title}</h3>
              <p className="text-base text-white/50 font-light leading-relaxed">{layer.detail}</p>
            </motion.div>
          ))}
        </div>

        <div className="pt-16 border-t border-white/20">
          <h2 className="text-4xl font-medium text-white mb-12">Technology Stack</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {stack.map((item) => (
              <div key={item.label} className="border border-white/10 p-6 space-y-4 hover:border-white/30 transition-colors">
                <p className="text-xs font-mono uppercase tracking-widest text-white/70">{item.label}</p>
                <ul className="space-y-3">
                  {item.tools.map((tool) => (
                    <li key={tool} className="text-sm font-light text-white/50 flex items-center gap-3">
                      <span className="w-1 h-1 bg-white/50 rounded-full" />
                      {tool}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-24">
          <h2 className="text-4xl font-medium text-white mb-8">Data Flow Topography</h2>
          <div className="border border-white/20 p-8 sm:p-12 space-y-8 bg-black/20 backdrop-blur-md">
            {[
              "1. Client ingress: Image + telemetry pushed to ingestion queue.",
              "2. Perception nodes execute background removal and generate 768-dimensional CLIP embeddings.",
              "3. FAISS cluster indexes the vector in real-time. Metadata is committed to primary datastore.",
              "4. Synthesis phase: Engine queries context (weather, temporal, behavioral priors).",
              "5. LLM pipeline generates deterministic stylistic narrative and returns strict JSON payload.",
              "6. Client renders interactive UI; feedback loops back to the telemetry bandit."
            ].map((flow, idx) => (
              <p key={idx} className="font-mono text-sm tracking-wide text-white/60">
                {flow}
              </p>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Architecture;

