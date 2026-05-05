import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Recycle, Clock, Droplets } from "lucide-react";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useOutfitGeneration } from "@/hooks/useOutfitGeneration";

const Analytics = () => {
  const { stats, isLoading: isLoadingWardrobe, items } = useWardrobe();
  const { savedOutfits, isLoadingSaved } = useOutfitGeneration();

  const displayStats = [
    { 
      label: "Rewear rate", 
      value: stats?.rewearRate ? `${Math.round(stats.rewearRate * 100)}%` : "0%", 
      delta: stats?.rewearRate ? `+${Math.round((stats.rewearRate - 0.3) * 100)}% vs baseline` : "No data yet" 
    },
    { 
      label: "Decision time", 
      value: "6.5 min", 
      delta: "-3.1 min per session" 
    },
    { 
      label: "Closet coverage", 
      value: stats?.itemsByCategory ? `${Math.round((Object.values(stats.itemsByCategory).reduce((a, b) => a + b, 0) / items.length) * 100) || 0}%` : "0%", 
      delta: "+9% items rotated" 
    },
    { 
      label: "Sustainability score", 
      value: stats?.rewearRate ? `${Math.round(stats.rewearRate * 100)} / 100` : "0 / 100", 
      delta: "+4 pts YoY" 
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-black">Insights & Analytics</h1>
        <p className="text-black/50 mt-2">
          Track your wardrobe usage and sustainability metrics
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoadingWardrobe ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="border-black/10 rounded-none bg-black/20 backdrop-blur-md transition-colors">
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
            <Card key={stat.label} className="border-black/10 rounded-none bg-black/20 backdrop-blur-md transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-black/50">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-black">{stat.value}</p>
                <p className="text-xs text-primary mt-1">{stat.delta}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-black/10 rounded-none bg-black/20 backdrop-blur-md transition-colors">
          <CardHeader>
            <CardTitle>Usage breakdown</CardTitle>
            <CardDescription>Placeholder stacked bars for tops, bottoms, shoes, and accessories.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {["Tops", "Bottoms", "Footwear", "Accessories"].map((category, index) => (
              <div key={category}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{category}</span>
                  <span className="text-black/50">{[68, 53, 47, 32][index]}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${[68, 53, 47, 32][index]}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-black/10 rounded-none bg-black/20 backdrop-blur-md transition-colors">
          <CardHeader>
            <CardTitle>Week overview</CardTitle>
            <CardDescription>Daily outfit generations and feedback logs (mocked).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-black/50">
            {[...Array(7)].map((_, day) => (
              <div
                key={day}
                className="flex items-center justify-between rounded-2xl border border-black/20 px-3 py-2"
              >
                <span>Day {day + 1}</span>
                <span>{Math.floor(Math.random() * 4) + 2} outfits · {Math.floor(Math.random() * 6) + 1} feedback</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-black/10 rounded-none bg-black/20 backdrop-blur-md transition-colors">
        <CardHeader>
          <CardTitle>Impact highlights</CardTitle>
          <CardDescription>Story-driven metrics presented with icons.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-black/20 p-4 space-y-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold text-black">Confidence spikes</p>
            <p className="text-sm text-black/50">+18% more outfit approvals week over week.</p>
          </div>
          <div className="rounded-2xl border border-black/20 p-4 space-y-2">
            <Recycle className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold text-black">Reuse focus</p>
            <p className="text-sm text-black/50">Eight rarely worn items reintroduced this month.</p>
          </div>
          <div className="rounded-2xl border border-black/20 p-4 space-y-2">
            <Clock className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold text-black">Faster prep</p>
            <p className="text-sm text-black/50">Decision time cut in half during weekday mornings.</p>
          </div>
          <div className="rounded-2xl border border-black/20 p-4 space-y-2">
            <Droplets className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold text-black">Weather wins</p>
            <p className="text-sm text-black/50">Humidity-aware suggestions triggered 11 times.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-black/10 rounded-none bg-black/20 backdrop-blur-md transition-colors">
        <CardHeader>
          <CardTitle>Data export</CardTitle>
          <CardDescription>Future button for exporting CSV / PDF snapshots.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Badge variant="secondary">CSV</Badge>
          <Badge variant="secondary">PDF</Badge>
          <Badge variant="secondary">Notion sync</Badge>
          <Badge variant="secondary">API (coming soon)</Badge>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;

