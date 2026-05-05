import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Testimonials } from "@/components/landing/Testimonials";
import { Footer } from "@/components/landing/Footer";

const Landing = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Testimonials />
      <Features />
      <Footer />
    </div>
  );
};

export default Landing;
