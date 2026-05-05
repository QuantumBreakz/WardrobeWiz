import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { BackButton } from "@/components/common/BackButton";
import { motion } from "framer-motion";

const pipeline = [
  {
    title: "01 / Ingestion",
    detail: "Computer vision immediately segments the subject, isolates color taxonomy, and strips background noise in real-time.",
  },
  {
    title: "02 / Indexing",
    detail: "Garments are projected into a 768-dimensional latent space, creating a topological map of your wardrobe.",
  },
  {
    title: "03 / Synthesis",
    detail: "Generative adversarial flows compile hyper-contextual outfits, narrating stylistic reasoning with sub-second latency.",
  },
];

const demoPanels = [
  {
    label: "Live Capture",
    description: "Real-time boundary detection and autonomous edge cleanup.",
    action: "Initialize Sequence",
  },
  {
    label: "Spatial Wardrobe",
    description: "Explore your inventory mapped by semantic similarity.",
    action: "Access Board",
  },
  {
    label: "Agentic Copilot",
    description: "Dialogue with the reasoning engine for micro-adjustments.",
    action: "Open Terminal",
  },
];

const Demo = () => {
  return (
    <main className="min-h-screen pt-32 pb-24 px-4 sm:px-6 lg:px-12 relative z-10 mix-blend-difference text-white">
      <section className="container mx-auto space-y-24">
        <BackButton className="mb-4 text-white" />
        
        <div className="space-y-16">
          <motion.header 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6 max-w-5xl"
          >
            <p className="font-mono text-xs uppercase tracking-[0.5em] text-white/50">Production Environment</p>
            <h1 className="text-6xl sm:text-8xl font-medium tracking-tight text-white leading-[1.1]">
              INTERACTIVE <br /> SIMULATION.
            </h1>
            <p className="text-2xl font-light text-white/60 max-w-3xl leading-relaxed">
              Experience the ingestion, retrieval, and synthesis pipelines in real-time. This is the exact flow that powers the wardrobewiz engine.
            </p>
          </motion.header>

          <div className="flex flex-col lg:flex-row gap-12 items-start border-t border-white/20 pt-16">
            <div className="flex-1 space-y-8">
              <p className="text-xl font-light text-white/60 leading-relaxed">
                Our demonstration environment lets you interface directly with the core heuristics of the platform. Upload real unstructured data, observe the vector clustering, and prompt the styling agent.
              </p>
              <div className="flex flex-wrap gap-6">
                <Button asChild variant="outline" size="lg" className="rounded-none border-white text-white hover:bg-white hover:text-black">
                  <Link to="/login" className="flex items-center gap-2">
                    INITIATE INSTANCE
                    <Play className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="lg" className="rounded-none text-white/50 hover:text-white font-mono uppercase tracking-widest text-sm">
                  View Source Telemetry
                </Button>
              </div>
            </div>

            <div className="w-full lg:w-[450px] border border-white/20 bg-black/20 backdrop-blur-md p-8 relative overflow-hidden group">
              <p className="font-mono text-xs uppercase tracking-[0.4em] text-white/50 mb-8">Viewport / Render</p>
              <div className="h-48 w-full border border-white/10 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1),transparent)]" />
                <div className="flex gap-4 items-end">
                  <div className="w-20 h-24 border border-white/30 bg-white/5 group-hover:h-32 transition-all duration-500" />
                  <div className="w-16 h-32 border border-white/30 bg-white/5 group-hover:h-24 transition-all duration-500" />
                  <div className="w-20 h-16 border border-white/30 bg-white/5 group-hover:h-28 transition-all duration-500 delay-100" />
                </div>
              </div>
              <p className="text-sm font-mono text-white/40 mt-6 tracking-wide">Status: Ready for rendering pipeline.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-3 border-y border-white/20 divide-y lg:divide-y-0 lg:divide-x divide-white/20">
          {pipeline.map((stage, i) => (
            <motion.div 
              key={stage.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 space-y-4 hover:bg-white/[0.03] transition-colors"
            >
              <h3 className="font-mono text-sm tracking-widest text-white/80">{stage.title}</h3>
              <p className="text-sm text-white/50 font-light leading-relaxed">{stage.detail}</p>
            </motion.div>
          ))}
        </div>

        <div className="pt-8">
          <h2 className="text-3xl font-medium text-white mb-12">Interface Modules</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {demoPanels.map((panel) => (
              <div key={panel.label} className="border border-white/10 p-8 space-y-4 hover:border-white/40 transition-colors">
                <p className="font-mono text-sm tracking-widest uppercase text-white/80">{panel.label}</p>
                <p className="text-sm font-light text-white/50 h-12">{panel.description}</p>
                <button className="text-xs font-mono uppercase tracking-[0.2em] text-white border-b border-white/30 pb-1 hover:border-white transition-colors">
                  {panel.action} →
                </button>
              </div>
            ))}
          </div>
        </div>

      </section>
    </main>
  );
};

export default Demo;

