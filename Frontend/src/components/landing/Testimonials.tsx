import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    quote: "wardrobewiz made our virtual try-on demo feel premium—faculty loved the clarity.",
    author: "Areeba Khan",
    role: "FAST-NUCES Final Year Student",
  },
  {
    quote: "I track feedback nightly. The RL agent keeps outfits inventive without new purchases.",
    author: "Danish I.",
    role: "Pilot User",
  },
  {
    quote: "Explainers translate fashion jargon into cues our stakeholders get instantly.",
    author: "Sara Malik",
    role: "Product Design Intern",
  },
];

export const Testimonials = () => {
  return (
    <section className="py-24 sm:py-32 border-t border-white/10 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 space-y-16">
        <div className="space-y-6">
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-white/40">Testimonials</p>
          <h2 className="text-4xl sm:text-5xl font-medium tracking-tight">Trusted by pioneers.</h2>
          <p className="text-white/60 font-light max-w-2xl text-lg">
            See how early adopters are transforming their daily routines with wardrobewiz.
          </p>
        </div>
        
        <div className="grid gap-0 md:grid-cols-3 border-y border-white/10 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {testimonials.map((testimonial) => (
            <article key={testimonial.author} className="p-8 sm:p-12 space-y-8 hover:bg-white/[0.02] transition-colors cursor-none group">
              <p className="text-lg font-light leading-relaxed text-white/80">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="pt-8 border-t border-white/10">
                <p className="font-mono uppercase tracking-widest text-sm">{testimonial.author}</p>
                <p className="text-xs text-white/40 mt-1">{testimonial.role}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="pt-16 border-t border-white/10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-white/40">Deep Dive</p>
            <h3 className="text-3xl font-medium tracking-tight">Explore the architecture.</h3>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button asChild variant="outline">
              <Link to="/architecture">Architecture</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/demo">Demo</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/documentation">Docs</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/research">Research</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

