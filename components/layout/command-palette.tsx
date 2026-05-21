"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Clock,
  Compass,
  History,
  Image as ImageIcon,
  Layers,
  Layout,
  Settings,
  Sparkles,
  SunMoon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useProductStore } from "@/lib/store/products";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: Props) {
  const router = useRouter();
  const products = useProductStore((s) => s.products);
  const recentlyViewed = useProductStore((s) => s.recentlyViewed);

  const [query, setQuery] = useState("");

  // Reset query when closed — deferred to keep setState out of the effect body.
  useEffect(() => {
    if (open) return;
    const t = window.setTimeout(() => setQuery(""), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  const recent = recentlyViewed
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 5);

  const fallbackTop = products.slice(0, 5);
  const recentList = recent.length > 0 ? recent : fallbackTop;

  const go = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command palette"
      description="Search products and jump anywhere"
    >
      <Command>
        <CommandInput
          placeholder="Search products, niches, actions…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>

          <CommandGroup heading={recent.length > 0 ? "Recent products" : "Top products"}>
            {recentList.map((p) => (
              <CommandItem
                key={p.id}
                value={`${p.name} ${p.category}`}
                onSelect={() => go(`/product/${p.id}`)}
              >
                <History className="mr-2 h-4 w-4" />
                <span className="flex-1 truncate">{p.name}</span>
                <span className="ml-2 font-mono text-xs text-text-dim">
                  {p.sellScore}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Quick actions">
            <CommandItem onSelect={() => go("/scan")}>
              <Sparkles className="mr-2 h-4 w-4" />
              Scan new product
              <CommandShortcut>S</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => go("/compare")}>
              <Layers className="mr-2 h-4 w-4" />
              Open compare
              <CommandShortcut>C</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                toast("Light theme coming later — dark is the brand");
                onOpenChange(false);
              }}
            >
              <SunMoon className="mr-2 h-4 w-4" />
              Toggle theme
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => go("/dashboard")}>
              <Compass className="mr-2 h-4 w-4" />
              Dashboard
              <CommandShortcut>⌘1</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => go("/compare")}>
              <Layers className="mr-2 h-4 w-4" />
              Compare
              <CommandShortcut>⌘2</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => go("/insights")}>
              <Compass className="mr-2 h-4 w-4" />
              Insights
              <CommandShortcut>⌘3</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => go("/scan")}>
              <ImageIcon className="mr-2 h-4 w-4" />
              Scan
              <CommandShortcut>⌘4</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => go("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </CommandItem>
            <CommandItem onSelect={() => go("/docs")}>
              <BookOpen className="mr-2 h-4 w-4" />
              Docs
            </CommandItem>
            <CommandItem onSelect={() => go("/changelog")}>
              <Clock className="mr-2 h-4 w-4" />
              Changelog
            </CommandItem>
            <CommandItem onSelect={() => go("/design-system")}>
              <Layout className="mr-2 h-4 w-4" />
              Design system
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
