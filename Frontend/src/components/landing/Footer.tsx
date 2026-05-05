import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-muted/50 border-t border-white/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-xl font-semibold text-white mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
              <span>wardrobewiz</span>
            </Link>
            <p className="text-sm text-white/50">
              Your personal AI stylist for a smarter, more sustainable wardrobe.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li><Link to="/product" className="hover:text-primary transition-colors">Product</Link></li>
              <li><Link to="/features" className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li><Link to="/company" className="hover:text-primary transition-colors">Company</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">About</Link></li>
              <li><Link to="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link to="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li><Link to="/legal" className="hover:text-primary transition-colors">Legal</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms</Link></li>
              <li><Link to="/security" className="hover:text-primary transition-colors">Security</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/20">
          <p className="text-center text-sm text-white/50">
            © 2024 wardrobewiz. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
