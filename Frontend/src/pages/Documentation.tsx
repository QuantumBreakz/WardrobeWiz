import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/common/BackButton";
import { motion } from "framer-motion";

const docSections = [
  {
    title: "Market Positioning",
    detail: "Analysis of high-intent consumer wardrobing. Metrics on inventory misutilization and the economic rationale for algorithmic curation.",
  },
  {
    title: "Competitive Topography",
    detail: "Benchmarking against legacy closet apps and broad-domain AI. Defining the wardrobewiz moat: latent retrieval + generative rationale.",
  },
  {
    title: "Engineering Specs",
    detail: "Strict functional topologies, sub-100ms latency SLAs, telemetry compliance, and data structure schemas.",
  },
  {
    title: "System Design",
    detail: "Containerized deployment strategies, vector index sharding, and LLM inference fallbacks.",
  },
];

const checklist = [
  { label: "Core heuristics validated", status: "STABLE" },
  { label: "Vector database cluster", status: "STABLE" },
  { label: "LLM Orchestration Layer", status: "ITERATING" },
  { label: "Generative UI Engine", status: "ITERATING" },
  { label: "Telemetry & RLHF", status: "QUEUED" },
];

const Documentation = () => {
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
          <p className="font-mono text-xs uppercase tracking-[0.5em] text-white/50">Technical Specifications</p>
          <h1 className="text-6xl sm:text-8xl font-medium tracking-tight text-white leading-[1.1]">
            DOCUMENTATION <br /> & SPECS.
          </h1>
          <p className="text-2xl font-light text-white/60 max-w-3xl leading-relaxed">
            The canonical source of truth for the wardrobewiz engineering and product protocols.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-8">
            <Button variant="outline" size="lg" className="rounded-none border-white text-white hover:bg-white hover:text-foreground">
              DOWNLOAD ARCHITECTURE.PDF
            </Button>
            <Button variant="ghost" size="lg" className="rounded-none text-white/50 hover:text-white font-mono uppercase tracking-widest text-sm">
              ACCESS NOTION WIKI
            </Button>
          </div>
        </motion.header>

        <div className="grid gap-0 lg:grid-cols-2 border-y border-white/20 divide-y lg:divide-y-0 lg:divide-x divide-white/20">
          {docSections.map((section, i) => (
            <motion.div 
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 sm:p-12 space-y-4 hover:bg-white/[0.03] transition-colors"
            >
              <h3 className="text-2xl font-medium text-white">{section.title}</h3>
              <p className="text-lg text-white/50 font-light leading-relaxed">{section.detail}</p>
            </motion.div>
          ))}
        </div>

        <div className="pt-8 grid gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <h2 className="text-3xl font-medium text-white">System Status</h2>
            <div className="border border-white/20 p-8 bg-foreground/20 backdrop-blur-md space-y-4">
              {checklist.map((item) => (
                <div key={item.label} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0 gap-2">
                  <p className="font-mono text-sm tracking-wide text-white/80">{item.label}</p>
                  <span className={`text-xs font-mono tracking-widest px-2 py-1 border ${
                    item.status === 'STABLE' ? 'border-green-500/50 text-green-400' :
                    item.status === 'ITERATING' ? 'border-yellow-500/50 text-yellow-400' :
                    'border-white/20 text-white/40'
                  }`}>
                    [{item.status}]
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-3xl font-medium text-white">Technical Chapters</h2>
            <div className="border border-white/20 bg-foreground/20 backdrop-blur-md divide-y divide-white/10">
              {[
                { ch: "01", title: "Problem Space", desc: "Data on wardrobe misutilization." },
                { ch: "02", title: "Product Vision", desc: "Defining the wardrobewiz algorithmic moat." },
                { ch: "03", title: "Landscape", desc: "Why legacy apps fail at synthesis." },
                { ch: "04", title: "Core SRS", desc: "Strict system requirements and constraints." },
                { ch: "05", title: "System Design", desc: "Containerized deployment and vector logic." },
              ].map((chapter) => (
                <div key={chapter.ch} className="p-6 hover:bg-white/[0.02] transition-colors flex gap-6 items-start">
                  <span className="font-mono text-sm text-white/30 pt-1">{chapter.ch}</span>
                  <div>
                    <h4 className="font-mono text-sm tracking-widest uppercase text-white/90">{chapter.title}</h4>
                    <p className="text-sm font-light text-white/50 mt-2">{chapter.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Documentation;

