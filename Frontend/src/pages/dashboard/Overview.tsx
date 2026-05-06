import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UploadCloud, MessageSquare, Sparkles, ShoppingBag, Ruler, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useOutfitGeneration } from "@/hooks/useOutfitGeneration";
import { Skeleton } from "@/components/ui/skeleton";

const wardrobeInspo = [
  {
    title: "Coastal Linen Set",
    source: "unsplash.com/photos/ZHvM3XIOHoE",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80",
  },
  {
    title: "Honey Knit",
    source: "unsplash.com/photos/-uHVRvDr7pg",
    image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=500&q=80",
  },
  {
    title: "Utility Shirt",
    source: "unsplash.com/photos/8manzosRGPE",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80",
  },
  {
    title: "Textured Loafers",
    source: "unsplash.com/photos/1_CMoFsPfso",
    image: "https://images.unsplash.com/photo-1483982258113-b72862e6cff6?auto=format&fit=crop&w=500&q=80",
  },
];

const defaultProfile = {
  height: `5'9"`,
  weight: "72 kg",
  collar: `15.5"`,
  waist: `32"`,
};

const Overview = () => {
  const { items, stats, isLoading: isLoadingWardrobe } = useWardrobe();
  const { savedOutfits, isLoadingSaved } = useOutfitGeneration();
  
  const [messages, setMessages] = useState([
    { role: "bot" as const, content: "Hi! Ask me anything about your closet or share a vibe you're going for." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [uploadedItems, setUploadedItems] = useState<{ name: string; size: string }[]>([]);
  const [profile, setProfile] = useState(defaultProfile);
  const [outfitPrompt, setOutfitPrompt] = useState("Board meeting in humid weather");
  const [outfitIdeas, setOutfitIdeas] = useState([
    "Navy chore coat + breathable oxford + tapered chinos",
    "Lightweight blazer + knit tee + loafers",
  ]);

  // Use real data when available, fallback to mock
  const displayStats = [
    { title: "Closet items", value: stats?.totalItems?.toString() || items.length.toString() || "0", description: "Digitized pieces ready to mix" },
    { title: "Looks generated", value: savedOutfits.length.toString() || "0", description: "Personalized outfit ideas" },
    { title: "Favorites saved", value: savedOutfits.filter(o => o.isFavorite).length.toString() || "0", description: "Pinned combinations" },
    { title: "Rewear boost", value: stats?.rewearRate ? `${Math.round(stats.rewearRate * 100)}%` : "0%", description: "More rotation vs. baseline" },
  ];

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = { role: "user" as const, content: chatInput.trim() };
    const botMsg = {
      role: "bot" as const,
      content: `On it! I'll search your wardrobe embeddings for: "${chatInput.trim()}". Expect a refreshed idea in the queue.`,
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setChatInput("");
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadedItems(
      files.map((file) => ({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
      })),
    );
  };

  const handleProfileChange = (key: keyof typeof defaultProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleOutfitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outfitPrompt.trim()) return;
    setOutfitIdeas([
      `Base: ${outfitPrompt}`,
      "Layer with navy outerwear, add breathable knit, finish with textured footwear.",
      "Accent with honey accessories or your favorite watch.",
    ]);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Wardrobe Command Center</h1>
        <p className="text-foreground/50 mt-2">
          Chat with wardrobewiz, upload pieces, set fit details, and spin up personalized outfits.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoadingWardrobe ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="border-foreground/10 rounded-none bg-transparent">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          displayStats.map((stat) => (
            <Card key={stat.title} className="border-foreground/10 rounded-none bg-transparent hover:bg-foreground/[0.02] transition-colors group cursor-none">
              <CardHeader className="pb-2 border-b border-foreground/10">
                <CardTitle className="font-mono text-xs uppercase tracking-widest text-foreground/40 group-hover:text-foreground transition-colors">{stat.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="font-mono text-4xl lg:text-5xl text-foreground">{stat.value}</p>
                <p className="text-sm font-light text-foreground/40 mt-4">{stat.description}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-white/10 rounded-none bg-black/40 backdrop-blur-md transition-colors text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-white/80">
              <MessageSquare className="h-5 w-5 text-primary" />
              Chat with wardrobewiz (RAG)
            </CardTitle>
            <CardDescription className="font-light text-white/50">Ask for outfit riffs, care tips, or closet summaries.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-48 overflow-y-auto rounded-xl border border-white/20 bg-muted/30 p-4 space-y-3">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground max-w-[80%] ml-auto"
                      : "bg-white/10 text-white max-w-[90%]",
                  )}
                >
                  {message.content}
                </div>
              ))}
            </div>
            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <Input
                placeholder="E.g. Need a smart-casual look for Karachi humidity"
                className="text-white border-white/20 placeholder:text-white/40"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <Button type="submit" variant="secondary">Send</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-foreground/10 rounded-none bg-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-foreground/60">
              <Ruler className="h-5 w-5 text-primary" />
              Personal Fit Profile
            </CardTitle>
            <CardDescription className="font-light text-foreground/40">Set the measurements wardrobewiz should remember.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(profile).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50">{key}</label>
                <Input value={value} onChange={(e) => handleProfileChange(key as keyof typeof defaultProfile, e.target.value)} />
              </div>
            ))}
            <Button variant="secondary" className="w-full">
              Save profile
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-foreground/10 rounded-none bg-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-foreground/60">
              <UploadCloud className="h-5 w-5 text-primary" />
              Wardrobe Customisation
            </CardTitle>
            <CardDescription>Drop new garments to keep your virtual closet updated.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-dashed border-primary/40 p-6 text-center bg-muted/30">
              <Input type="file" multiple onChange={handleUpload} className="hidden" id="wardrobe-upload" />
              <label htmlFor="wardrobe-upload" className="cursor-pointer flex flex-col items-center gap-2 text-sm text-foreground/50">
                <UploadCloud className="h-8 w-8 text-primary" />
                <span>
                  Click to upload or drag & drop. PNG, JPG up to 5MB.
                </span>
              </label>
            </div>
            {!uploadedItems.length ? (
              <p className="text-sm text-foreground/50">No uploads yet. Your last sync was 2 days ago.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {uploadedItems.map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-xl border border-foreground/20 px-3 py-2">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-foreground/50">{item.size}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-foreground/10 rounded-none bg-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-foreground/60">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Wardrobe Inspiration Feed
            </CardTitle>
            <CardDescription>Reference looks pulled from trusted catalogs.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {wardrobeInspo.map((item) => (
                <div key={item.title} className="rounded-2xl border border-foreground/20 overflow-hidden">
                  <img src={item.image} alt={item.title} className="h-32 w-full object-cover" />
                  <div className="p-3">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-foreground/50 truncate">{item.source}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-foreground/10 rounded-none bg-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-foreground/60">
              <Wand2 className="h-5 w-5 text-primary" />
              Outfit Generator
            </CardTitle>
            <CardDescription>Type the scenario, get a curated combination.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleOutfitSubmit} className="space-y-3">
              <Textarea value={outfitPrompt} onChange={(e) => setOutfitPrompt(e.target.value)} placeholder="E.g. Wedding welcome dinner in Lahore" />
              <Button type="submit" className="w-full">
                Generate outfit
              </Button>
            </form>
            <div className="space-y-2">
              {outfitIdeas.map((idea, idx) => (
                <div key={idx} className="rounded-2xl border border-foreground/20 px-3 py-2 text-sm">
                  {idea}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-foreground/10 rounded-none bg-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-foreground/60">
              <Sparkles className="h-5 w-5 text-primary" />
              Personalization Notes
            </CardTitle>
            <CardDescription>Track reminders that nudge the AI toward your vibe.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-2xl border border-foreground/20 p-3">
              Prefers breathable fabrics for humidity. Remind me to include at least one statement accessory.
            </div>
            <div className="rounded-2xl border border-foreground/20 p-3">
              Avoid wool layers during day events. Suggest loafers or sneakers over dress shoes when the commute is longer than 1 km.
            </div>
            <div className="rounded-2xl border border-foreground/20 p-3">
              Palette favorites: navy, honey, off-white. Avoid neon except for gym looks.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
