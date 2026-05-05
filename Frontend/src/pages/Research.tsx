import { BackButton } from "@/components/common/BackButton";
import { motion } from "framer-motion";

const comparisons = [
  { name: "Legacy Closets (StyleBook, Whering)", limit: "Deterministic logic. No spatial understanding of garments.", moat: "Generative synthesis & contextual rationale." },
  { name: "Broad-Domain LLMs (ChatGPT)", limit: "Hallucinations in styling constraints. No persistent state.", moat: "Deterministic JSON routing & personal latent priors." },
  { name: "Academic Prototypes (Fashwell)", limit: "Inference latency >2000ms. No consumer UX.", moat: "Sub-50ms FAISS lookup via optimized ViT vectors." },
];

const metrics = [
  { metric: "Retrieval Accuracy (R@10)", target: "> 94%", desc: "Precision of complementary piece suggestion." },
  { metric: "Inference Latency", target: "< 120ms", desc: "End-to-end vector lookup + LLM synthesis." },
  { metric: "Inventory Utilization", target: "+400%", desc: "Increase in rewear probability for dormant items." },
];

const Research = () => {
  return (
    <main className="min-h-screen pt-32 pb-24 px-4 sm:px-6 lg:px-12 relative z-10 mix-blend-difference text-white">
      <section className="container mx-auto space-y-24">
        <BackButton className="mb-4 text-white" />
        
        <motion.header 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 max-w-5xl"
        >
          <p className="font-mono text-xs uppercase tracking-[0.5em] text-white/50">Algorithmic Foundations</p>
          <h1 className="text-6xl sm:text-8xl font-medium tracking-tight text-white leading-[1.1]">
            R&D <br /> INTELLIGENCE.
          </h1>
          <p className="text-2xl font-light text-white/60 max-w-3xl leading-relaxed">
            The mathematical and empirical basis for the wardrobewiz engine. Benchmarks, embedding strategies, and generative optimizations.
          </p>
        </motion.header>

        <div className="pt-16 border-t border-white/20">
          <h2 className="text-3xl font-medium text-white mb-12">Competitive Differentiation</h2>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="font-mono text-xs uppercase tracking-widest text-white/50 pb-6 pr-8 w-1/4">Vector / Entity</th>
                  <th className="font-mono text-xs uppercase tracking-widest text-white/50 pb-6 pr-8 w-1/3">Architectural Limits</th>
                  <th className="font-mono text-xs uppercase tracking-widest text-white pb-6 w-5/12">wardrobewiz Algorithmic Moat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {comparisons.map((row) => (
                  <tr key={row.name} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-8 pr-8 font-mono text-sm tracking-wide text-white/90">{row.name}</td>
                    <td className="py-8 pr-8 text-sm font-light text-white/50 leading-relaxed">{row.limit}</td>
                    <td className="py-8 text-sm font-light text-white leading-relaxed">{row.moat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 pt-12 border-t border-white/20">
          <div className="space-y-8">
            <h2 className="text-3xl font-medium text-white">Target Telemetry Metrics</h2>
            <div className="border border-white/20 p-8 space-y-6 bg-black/20 backdrop-blur-md">
              {metrics.map((row) => (
                <div key={row.metric} className="flex flex-col border-b border-white/10 pb-6 last:border-0 last:pb-0">
                  <div className="flex justify-between items-baseline mb-2">
                    <p className="font-mono text-sm tracking-wide text-white/90">{row.metric}</p>
                    <p className="font-mono text-lg text-white">{row.target}</p>
                  </div>
                  <p className="text-sm font-light text-white/40">{row.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-3xl font-medium text-white">Dataset & Pre-training</h2>
            <div className="border border-white/20 p-8 space-y-8 bg-black/20 backdrop-blur-md">
              <div className="space-y-2">
                <p className="font-mono text-xs uppercase tracking-widest text-white/50">Base Model (Perception)</p>
                <p className="text-white text-lg">DeepFashion2 + Custom Spatial Corpus</p>
                <p className="text-sm font-light text-white/50">Fine-tuned for localized occlusion handling and edge-case lighting normalization.</p>
              </div>
              <div className="space-y-2 border-t border-white/10 pt-6">
                <p className="font-mono text-xs uppercase tracking-widest text-white/50">Latent Vector Space</p>
                <p className="text-white text-lg">CLIP ViT-L/14 Embeddings</p>
                <p className="text-sm font-light text-white/50">Aligns visual garment topology with semantic text bounds for highly accurate cross-modal retrieval.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Research;

