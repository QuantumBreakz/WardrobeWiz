import { BackButton } from "@/components/common/BackButton";
import { motion } from "framer-motion";

type Section = {
  title: string;
  description: string;
  bullets?: string[];
};

type SitePageTemplateProps = {
  title: string;
  description: string;
  sections: Section[];
};

const SitePageTemplate = ({ title, description, sections }: SitePageTemplateProps) => {
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
          <p className="font-mono text-xs uppercase tracking-[0.5em] text-white/50">wardrobewiz // Information Layer</p>
          <h1 className="text-6xl sm:text-8xl font-medium tracking-tight text-white leading-[1.1]">
            {title.toUpperCase()}
          </h1>
          <p className="text-2xl font-light text-white/60 max-w-3xl leading-relaxed">
            {description}
          </p>
        </motion.header>

        <div className="grid gap-0 md:grid-cols-2 border-y border-white/20 divide-y md:divide-y-0 md:divide-x divide-white/20">
          {sections.map((section, i) => (
            <motion.article 
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 sm:p-12 space-y-6 hover:bg-white/[0.03] transition-colors"
            >
              <h2 className="text-3xl font-medium text-white">{section.title}</h2>
              <p className="text-lg text-white/50 font-light leading-relaxed">{section.description}</p>
              {section.bullets && (
                <ul className="pt-4 space-y-3">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="text-sm font-light text-white/50 flex items-start gap-3">
                      <span className="w-1.5 h-1.5 bg-white/50 rounded-none mt-2 shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default SitePageTemplate;

