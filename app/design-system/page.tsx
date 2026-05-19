"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Command as CommandIcon,
  Heart,
  Info,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { TopNav } from "@/components/layout/top-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

import {
  FadeIn,
  SlideIn,
  StaggerChildren,
  StaggerItem,
  ScoreNumber,
  ScoreRing,
  Sparkline,
  PulseDot,
  ShimmerBox,
  RevealOnScroll,
} from "@/components/animated";

const colorTokens = [
  { name: "ink", value: "#0A0A0B", className: "bg-ink" },
  { name: "surface", value: "#111113", className: "bg-surface" },
  {
    name: "surface-elevated",
    value: "#16161A",
    className: "bg-surface-elevated",
  },
  { name: "border-soft", value: "#1F1F23", className: "bg-border-soft" },
  {
    name: "border-strong",
    value: "#2A2A2F",
    className: "bg-border-strong",
  },
  { name: "text", value: "#FAFAFA", className: "bg-text" },
  { name: "text-muted", value: "#9CA3AF", className: "bg-text-muted" },
  { name: "text-dim", value: "#6B7280", className: "bg-text-dim" },
];

const accentTokens = [
  { name: "go", value: "#00D26A", className: "bg-go" },
  { name: "test", value: "#F5A623", className: "bg-test" },
  { name: "risky", value: "#F97316", className: "bg-risky" },
  { name: "skip", value: "#EF4444", className: "bg-skip" },
  { name: "info", value: "#3B82F6", className: "bg-info" },
];

const sparklineData = [
  4, 6, 5, 9, 7, 12, 10, 14, 13, 17, 16, 21, 19, 24, 22, 28, 26, 32,
];

export default function DesignSystemPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [openSheet, setOpenSheet] = useState(false);

  return (
    <TooltipProvider>
      <TopNav />
      <main className="mx-auto w-full max-w-7xl px-6 py-14">
        <FadeIn>
          <header className="mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface/60 px-3 py-1 text-xs text-text-muted">
              <PulseDot size={6} />
              Wynner Design System
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
              Foundation
            </h1>
            <p className="mt-3 max-w-xl text-text-muted">
              Every token, primitive, animation, and shadcn component that the
              app is built on. If it lives here, it&apos;s production-ready.
            </p>
          </header>
        </FadeIn>

        <Section title="Brand surface" subtitle="The neutral spine">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {colorTokens.map((c) => (
              <Swatch key={c.name} {...c} />
            ))}
          </div>
        </Section>

        <Section title="Verdict accents" subtitle="The decision palette">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {accentTokens.map((c) => (
              <Swatch key={c.name} {...c} />
            ))}
          </div>
        </Section>

        <Section
          title="Verdict glow shadows"
          subtitle="Soft halo for elevated cards"
        >
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {[
              { name: "shadow-glow-go", className: "shadow-glow-go" },
              { name: "shadow-glow-test", className: "shadow-glow-test" },
              { name: "shadow-glow-risky", className: "shadow-glow-risky" },
              { name: "shadow-glow-skip", className: "shadow-glow-skip" },
            ].map((s) => (
              <div
                key={s.name}
                className={`flex h-24 items-center justify-center rounded-xl bg-surface-elevated font-mono text-xs text-text-muted ${s.className}`}
              >
                {s.name}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typography" subtitle="Geist + JetBrains Mono">
          <div className="space-y-4 rounded-xl border border-border-soft bg-surface/60 p-6">
            <h1 className="text-5xl font-semibold tracking-tight">
              Display 5xl — Know before you launch
            </h1>
            <h2 className="text-3xl font-semibold tracking-tight">
              Heading 3xl — Saturation index rising
            </h2>
            <h3 className="text-xl font-medium tracking-tight">
              Subhead xl — 127 stores have launched this week
            </h3>
            <p className="text-base text-text">
              Body base — clean, calm, confident. Geist reads beautifully at
              every size in the dark surface.
            </p>
            <p className="text-sm text-text-muted">
              Body small muted — supporting metadata, descriptions, helper
              copy.
            </p>
            <p className="font-mono text-sm">
              Mono — 92.4% margin · $24.99 retail · 4.2× ROAS
            </p>
          </div>
        </Section>

        <Section
          title="Animated primitives"
          subtitle="The motion vocabulary"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">FadeIn</CardTitle>
                <CardDescription>opacity + 8px y slide</CardDescription>
              </CardHeader>
              <CardContent>
                <FadeIn className="rounded-md bg-surface-elevated p-4 text-sm text-text-muted">
                  This block fades in on mount.
                </FadeIn>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SlideIn</CardTitle>
                <CardDescription>directional 24px slide</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <SlideIn direction="left" className="rounded-md bg-surface-elevated p-2 text-xs text-text-muted">
                  ← from left
                </SlideIn>
                <SlideIn direction="right" delay={0.1} className="rounded-md bg-surface-elevated p-2 text-xs text-text-muted">
                  from right →
                </SlideIn>
                <SlideIn direction="up" delay={0.2} className="rounded-md bg-surface-elevated p-2 text-xs text-text-muted">
                  ↑ from below
                </SlideIn>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">StaggerChildren</CardTitle>
                <CardDescription>0.06s child stagger</CardDescription>
              </CardHeader>
              <CardContent>
                <StaggerChildren className="space-y-1.5">
                  {["First", "Second", "Third", "Fourth"].map((label) => (
                    <StaggerItem
                      key={label}
                      className="rounded-md bg-surface-elevated px-3 py-1.5 text-xs text-text-muted"
                    >
                      {label}
                    </StaggerItem>
                  ))}
                </StaggerChildren>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">ScoreNumber</CardTitle>
                <CardDescription>react-countup, easeOutExpo</CardDescription>
              </CardHeader>
              <CardContent className="flex items-end gap-6">
                <ScoreNumber
                  value={84}
                  className="text-5xl font-semibold text-go"
                />
                <ScoreNumber
                  value={47}
                  className="text-3xl font-semibold text-test"
                />
                <ScoreNumber
                  value={12}
                  className="text-2xl font-semibold text-skip"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">ScoreRing</CardTitle>
                <CardDescription>animated SVG progress</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-5">
                <ScoreRing value={88} label="Go" />
                <ScoreRing value={64} label="Test" />
                <ScoreRing value={42} label="Risky" />
                <ScoreRing value={17} label="Skip" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sparkline</CardTitle>
                <CardDescription>inline trend</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Sparkline data={sparklineData} color="#00D26A" />
                <Sparkline data={sparklineData.slice().reverse()} color="#F5A623" />
                <Sparkline data={[8, 4, 7, 3, 9, 2, 8, 5, 10]} color="#3B82F6" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">PulseDot</CardTitle>
                <CardDescription>live signal</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <PulseDot color="#00D26A" />
                  <span className="text-sm text-text-muted">Live</span>
                </div>
                <div className="flex items-center gap-2">
                  <PulseDot color="#F5A623" />
                  <span className="text-sm text-text-muted">Watching</span>
                </div>
                <div className="flex items-center gap-2">
                  <PulseDot color="#EF4444" />
                  <span className="text-sm text-text-muted">Alert</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">ShimmerBox</CardTitle>
                <CardDescription>loading skeleton</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <ShimmerBox height={14} />
                <ShimmerBox height={14} width="80%" />
                <ShimmerBox height={14} width="60%" />
                <div className="pt-2 flex items-center gap-3">
                  <ShimmerBox width={40} height={40} rounded="full" />
                  <div className="flex-1 space-y-1.5">
                    <ShimmerBox height={10} width="50%" />
                    <ShimmerBox height={10} width="30%" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">RevealOnScroll</CardTitle>
                <CardDescription>fades in when 30% visible</CardDescription>
              </CardHeader>
              <CardContent>
                <RevealOnScroll className="rounded-md bg-surface-elevated p-4 text-sm text-text-muted">
                  Scroll me into view — I only animate once.
                </RevealOnScroll>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section
          title="Shadcn primitives"
          subtitle="The building blocks"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Buttons</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button>
                  <Sparkles className="mr-1.5 h-4 w-4" /> Primary
                </Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button size="sm">Small</Button>
                <Button size="icon" aria-label="Heart">
                  <Heart className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Input + Select</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Paste a product URL…" />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a verdict" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="go">Go</SelectItem>
                    <SelectItem value="test">Test</SelectItem>
                    <SelectItem value="risky">Risky</SelectItem>
                    <SelectItem value="skip">Skip</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Badges</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge className="border-go/30 bg-go/10 text-go">
                  <TrendingUp className="mr-1 h-3 w-3" /> Trending
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={28} />
                <Progress value={62} />
                <Progress value={91} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tabs</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="market">Market</TabsTrigger>
                    <TabsTrigger value="creative">Creative</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="pt-3 text-sm text-text-muted">
                    Product overview content.
                  </TabsContent>
                  <TabsContent value="market" className="pt-3 text-sm text-text-muted">
                    Market saturation content.
                  </TabsContent>
                  <TabsContent value="creative" className="pt-3 text-sm text-text-muted">
                    Ad creative angles content.
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tooltip + HoverCard</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">
                      <Info className="mr-1.5 h-3.5 w-3.5" /> Hover me
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>This is a tooltip</TooltipContent>
                </Tooltip>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button variant="ghost">@wynner</Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="text-sm">
                    Wynner — premium dropshipping intelligence.
                  </HoverCardContent>
                </HoverCard>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dropdown</CardTitle>
              </CardHeader>
              <CardContent>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Actions <ChevronDown className="ml-1.5 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Product</DropdownMenuLabel>
                    <DropdownMenuItem>
                      <Search className="mr-2 h-4 w-4" /> Re-scan
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Heart className="mr-2 h-4 w-4" /> Save to vault
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" /> Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Command</CardTitle>
              </CardHeader>
              <CardContent>
                <Command className="rounded-lg border border-border-soft">
                  <CommandInput placeholder="Type a command…" />
                  <CommandList>
                    <CommandEmpty>No results.</CommandEmpty>
                    <CommandGroup heading="Suggestions">
                      <CommandItem>
                        <Sparkles className="mr-2 h-4 w-4" /> New scan
                      </CommandItem>
                      <CommandItem>
                        <Check className="mr-2 h-4 w-4" /> Open vault
                      </CommandItem>
                      <CommandItem>
                        <CommandIcon className="mr-2 h-4 w-4" /> Settings
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dialog + Sheet</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Open dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm scan</DialogTitle>
                      <DialogDescription>
                        This will use 1 credit from your monthly allowance.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="ghost"
                        onClick={() => setOpenDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={() => setOpenDialog(false)}>
                        Run scan <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Sheet open={openSheet} onOpenChange={setOpenSheet}>
                  <SheetTrigger asChild>
                    <Button variant="outline">Open sheet</Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                      <SheetDescription>
                        Refine your dashboard by score, niche, or saturation.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-3">
                      <Input placeholder="Niche" />
                      <Input placeholder="Min score" />
                    </div>
                  </SheetContent>
                </Sheet>

                <Button
                  onClick={() =>
                    toast.success("Scan complete", {
                      description: "Score 84 · Go",
                    })
                  }
                >
                  Show toast
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Skeleton + ScrollArea</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <Separator />
                <ScrollArea className="h-32 rounded-md border border-border-soft p-3 text-sm">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="border-b border-border-soft/60 py-1.5 text-text-muted last:border-b-0"
                    >
                      Row {i + 1}
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Card with footer</CardTitle>
                <CardDescription>Anatomy reference</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-text-muted">
                A card pulls everything together — header, content, optional
                footer. Use shadow-glow-* on hover for emphasis.
              </CardContent>
              <CardFooter className="justify-end">
                <Button size="sm" variant="ghost">
                  Action
                </Button>
              </CardFooter>
            </Card>
          </div>
        </Section>

        <div className="h-32" />
      </main>
    </TooltipProvider>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-16">
      <div className="mb-5 flex items-end justify-between border-b border-border-soft pb-3">
        <div>
          <h2 className="text-xl font-medium tracking-tight">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function Swatch({
  name,
  value,
  className,
}: {
  name: string;
  value: string;
  className: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border-soft bg-surface/60">
      <div className={`h-20 ${className}`} />
      <div className="flex items-center justify-between px-3 py-2 text-xs">
        <span className="text-text">{name}</span>
        <span className="font-mono text-text-dim">{value}</span>
      </div>
    </div>
  );
}
