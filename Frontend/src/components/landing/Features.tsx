import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Sparkles, TrendingUp, Heart } from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Smart Wardrobe Upload",
    description: "Easily upload and organize your clothing items. Our AI automatically categorizes and tags everything for you.",
  },
  {
    icon: Sparkles,
    title: "AI Outfit Recommendations",
    description: "Get personalized outfit suggestions based on weather, occasion, and your unique style preferences.",
  },
  {
    icon: TrendingUp,
    title: "Sustainability Insights",
    description: "Track your fashion footprint and discover how to make more sustainable wardrobe choices.",
  },
  {
    icon: Heart,
    title: "Personalized Learning",
    description: "The more you use wardrobewiz, the better it understands your style and preferences.",
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-16 sm:py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Everything You Need to Style Smarter
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Powerful features that make managing your wardrobe effortless and fun.
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="border-white/20 border-white/10 rounded-none bg-foreground/20 backdrop-blur-md transition-colors hover:border-white/10 rounded-none bg-foreground/20 backdrop-blur-md transition-colors-hover transition-shadow duration-300"
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/50">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
