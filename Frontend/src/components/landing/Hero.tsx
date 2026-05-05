import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Activity, ArrowRight, PlayCircle, Recycle, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const heroStats = [
  { value: "12k", label: "Virtual try-ons", detail: "Closets digitized" },
  { value: "18m", label: "Time saved / session", detail: "Decision relief" },
  { value: "+42%", label: "Rewear rate", detail: "Idle pieces revived" },
];

const workflowTiles = [
  { tag: "I", title: "Capture", blurb: "Guided capture, cleanup, and textile tags keep data trustworthy." },
  { tag: "II", title: "Try-On", blurb: "Mix actual garments with weather, mood, or occasion overlays." },
  { tag: "III", title: "Explain", blurb: "Plain-language tips make every outfit choice obvious." },
];

const pipelineSteps = [
  { title: "Capture", detail: "Framing hints keep garment photos crisp." },
  { title: "Organize", detail: "Wardrobe items auto-tag into categories and palettes." },
  { title: "Match", detail: "Mixes pieces instantly for weather, mood, or agenda." },
  { title: "Explain", detail: "Tells you why each choice works, no jargon." },
  { title: "Refine", detail: "Daily reactions keep ideas fresh and personal." },
];

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 sm:pt-48 sm:pb-32 px-4 sm:px-6 lg:px-12">
      <div className="container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-7xl"
        >
          <p className="font-mono text-xs uppercase tracking-[0.4em] mb-8 text-white/60">I - VI PILLARS</p>
          <h1 className="text-5xl sm:text-7xl lg:text-[7rem] font-medium leading-[1.05] tracking-tight mb-8">
            Try every outfit from your closet.
          </h1>
          <p className="text-lg sm:text-2xl font-light text-white/70 max-w-3xl leading-relaxed mb-16">
            wardrobewiz blends friendly AI and your real wardrobe photos to become a responsive styling cockpit.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <Link to="/register" className="group flex items-center gap-4 text-sm font-mono uppercase tracking-widest border-b border-foreground pb-2 hover:opacity-70 transition-opacity cursor-none">
              Get Personalized Plan <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/demo" className="group flex items-center gap-4 text-sm font-mono uppercase tracking-widest border-b border-foreground/30 pb-2 hover:opacity-70 transition-opacity text-white/60 cursor-none">
              <PlayCircle className="h-4 w-4" /> Watch Demo
            </Link>
          </div>
        </motion.div>

        {/* Horizontal Grid Section mimicking the "Living with the product" screenshot */}
        <div className="mt-40 pt-16 border-t border-white/10 relative">
           <div className="absolute top-0 left-0 -translate-y-1/2 flex items-center gap-4 bg-background px-4">
              <span className="font-mono text-xs uppercase tracking-widest text-white/40">Workflow Architecture</span>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
              {workflowTiles.map((tile) => (
                <div key={tile.tag} className="p-8 md:p-12 space-y-6 hover:bg-white/[0.02] transition-colors cursor-none group">
                  <p className="font-mono text-sm text-white/40 transition-colors group-hover:text-white">{tile.tag}</p>
                  <h3 className="text-2xl font-medium">{tile.title}</h3>
                  <p className="text-white/60 font-light leading-relaxed">{tile.blurb}</p>
                </div>
              ))}
           </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 border-t border-b border-white/10">
          {heroStats.map((stat) => (
            <div key={stat.label} className="p-8 md:p-12 flex flex-col items-start gap-2">
              <span className="font-mono text-4xl lg:text-6xl text-white">{stat.value}</span>
              <span className="font-mono text-xs uppercase tracking-widest text-white/60 mt-4">{stat.label}</span>
              <span className="text-sm font-light text-white/40">{stat.detail}</span>
            </div>
          ))}
        </div>

        {/* Pipeline details mimicking the "Being in the Details" screenshot */}
        <div className="mt-40">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight mb-8">Being in the details.</h2>
          <p className="text-xl font-light text-white/60 max-w-4xl mb-20">
            Ship reliable digital outfits end to end: wardrobewiz turns thoughtful engineering into scalable styling experiences.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-white/10 border-t border-b border-white/10">
            {pipelineSteps.map((step) => (
              <div key={step.title} className="p-6 md:p-8 space-y-4 hover:bg-white/[0.02] transition-colors cursor-none group">
                <p className="font-mono text-xs uppercase tracking-widest text-white/60 border-b border-white/10 pb-4 transition-colors group-hover:text-white">{step.title}</p>
                <p className="text-sm font-light text-white/50 leading-relaxed pt-2">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
