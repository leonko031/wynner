import type { Product, ProductReasoning, Niche, Source, Verdict } from "@/types";
import { verdictFromScore } from "@/types";
import { imageForNiche } from "@/lib/data/image-bank";

/**
 * Seed generator — produces ~120 realistic dropship products across all 14
 * niches with a verdict distribution tilted toward TEST (the sweet spot).
 *
 * Images come from a per-niche image bank (lib/data/image-bank.ts) so all
 * URLs are stable Unsplash CDN paths. Names + descriptions per niche.
 */

function id(n: number): string {
  return `wp-${String(n).padStart(3, "0")}`;
}

const NOW = "2026-05-17T12:00:00.000Z";

/** Deterministic pseudo-random in [0, 1) for a seed integer. */
function rng(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return Math.abs(x - Math.floor(x));
}

function makeTrend(
  seed: number,
  shape: "climbing" | "flat" | "spiky" | "declining" | "dead",
): number[] {
  const out: number[] = [];
  for (let i = 0; i < 30; i++) {
    const r = rng(seed * 91 + i * 7);
    let value = 0;
    switch (shape) {
      case "climbing":
        value = 12 + i * 1.3 + r * 6;
        break;
      case "flat":
        value = 30 + r * 8;
        break;
      case "spiky":
        value = 20 + Math.sin(i * 0.6) * 18 + r * 10;
        break;
      case "declining":
        value = 50 - i * 1.1 + r * 6;
        break;
      case "dead":
        value = 8 + r * 4;
        break;
    }
    out.push(Math.max(2, Math.round(value)));
  }
  return out;
}

// =====================================================================
//   Per-niche names & descriptions
// =====================================================================
const NAMES_BY_NICHE: Record<Niche, string[]> = {
  pet: [
    "Magnetic posture corrector belt",
    "Pet hair vacuum attachment kit",
    "Wi-Fi pet feeder with camera",
    "Slow-feeder anti-gulp dog bowl",
    "Elevated stainless steel dog bowl",
    "Self-cleaning litter box (compact)",
    "Anti-anxiety dog harness vest",
    "Laser pointer cat play tower",
    "Pet hydration fountain (filtered)",
    "Indestructible chew toy bundle",
    "GPS dog collar tracker",
    "Pet paw cleaning silicone cup",
  ],
  home: [
    "LED motion-sensor toilet light",
    "Rechargeable cordless fabric shaver",
    "Mini portable HEPA air purifier",
    "Smart aroma diffuser with timer",
    "Adhesive LED kitchen under-cabinet strip",
    "Magnetic LED key-rack organizer",
    "Self-stick wall hooks (heavy duty)",
    "Bluetooth ceiling shower speaker",
    "Smart sleep noise white-noise lamp",
    "Reusable silicone drain protector",
    "Vacuum dust mites mattress wand",
    "Foldable hanging closet organizer",
  ],
  wellness: [
    "Lumbar memory-foam chair pillow",
    "Heated Bluetooth eye massager",
    "Acupressure neck stretcher cradle",
    "Cordless percussion massager",
    "Adjustable cervical neck pillow",
    "Foot reflexology rolling stick",
    "Sunrise alarm clock SAD lamp",
    "TENS unit muscle stimulator (mini)",
    "Heated knee compression wrap",
    "Pulse oximeter fingertip clip",
    "Magnetic posture corrector belt",
    "Vibrating jade gua sha tool",
  ],
  beauty: [
    "Magnetic reusable eyelash kit",
    "Reusable silicone makeup remover pads",
    "LED facial light therapy mask",
    "Ice roller skincare wand",
    "Heatless silk curling rod set",
    "Microcurrent face-lift wand (mini)",
    "Magnetic lash & liner combo",
    "Reusable hair removal pad (crystal)",
    "Bluetooth heated eyelash curler",
    "Cooling under-eye gel pads",
    "Vibrating jade gua sha tool",
    "LED collagen lip therapy wand",
  ],
  kitchen: [
    "Self-stirring temperature-control mug",
    "Silicone stretch food storage lids",
    "Reusable silicone Ziploc replacement bags",
    "USB-rechargeable electric salt-pepper mill",
    "Magnetic stovetop splatter screen",
    "Foldable expandable dish rack",
    "Vegetable spiralizer (8-blade)",
    "Smart digital meat thermometer (Bluetooth)",
    "Silicone egg poacher 4-pack",
    "Magnetic measuring spoon set",
    "Adjustable rolling pin (depth-control)",
    "Microwavable popcorn silicone bowl",
  ],
  fitness: [
    "Resistance band set with door anchor",
    "Smart-counter jump rope (cordless option)",
    "Adjustable kettlebell (4-in-1)",
    "Sliding core gliders",
    "Foldable acupressure mat",
    "Massage ball lacrosse set",
    "Pull-up bar doorway (no-screw)",
    "Compact rebounder mini trampoline",
    "Push-up handle rotating grips",
    "Resistance band ankle straps",
    "Posture coach wearable buzzer",
    "Magnetic adjustable wrist weights",
  ],
  tech: [
    "Phone tripod with Bluetooth remote",
    "Vertical ergonomic mouse",
    "UV-C phone sanitizer box",
    "Wireless car phone charger mount",
    "Foldable Bluetooth keyboard",
    "Privacy webcam slider cover",
    "USB-C hub 7-in-1 expansion",
    "Mini Bluetooth thermal label printer",
    "Magnetic SD-card travel case",
    "AirTag silicone keyring case",
    "Adjustable laptop stand (cooling)",
    "Foldable phone ring grip stand",
  ],
  kids: [
    "LED light-up kids sneakers",
    "Magnetic building blocks (100-pc)",
    "Montessori busy board",
    "Glow-in-the-dark drawing pad",
    "Bath crayons soluble pack",
    "Plush night-light projector",
    "Kids smartwatch GPS tracker",
    "STEM assemble-it-yourself robot kit",
    "Foldable kids scooter (3-wheel)",
    "Bilingual reading flashcards",
    "Glow stars wall sticker set",
    "Kids melamine snack divider plate",
  ],
  car: [
    "Magnetic dashboard phone mount",
    "Foldable trunk organizer with cooler",
    "Compact handheld car vacuum",
    "Dash cam front + rear 1080p",
    "LED interior ambient strip",
    "Headrest hidden hooks (twin)",
    "Universal sun-shade umbrella",
    "Bluetooth backseat tablet mount",
    "Wireless tire pressure monitor (4)",
    "Magnetic phone car cradle (Qi)",
    "Foldable cargo cooler trunk box",
    "Microfiber streak-free towel",
  ],
  outdoor: [
    "Double-layer camping hammock",
    "Solar inflatable LED lantern",
    "Portable water filter straw",
    "Camping shovel multi-tool",
    "Foldable bucket 10L",
    "Insulated stainless travel growler",
    "Self-inflating sleeping pad",
    "Bluetooth hiking compass watch",
    "Telescopic carbon fishing rod",
    "Pop-up beach changing tent",
    "Magnetic tactical pocket EDC",
    "Headlamp rechargeable 1000lm",
  ],
  fashion: [
    "Graduated compression sock 6-pack",
    "Magnetic eyeglass holder pendant",
    "Stretch belt no-show buckle",
    "Cordless heated electric scarf",
    "Magnetic invisible bra strap",
    "Reusable shoe shaper (foam pair)",
    "Silicone reusable hair tie pack",
    "Adjustable straw hat foldable",
    "Travel jewelry roll-up case",
    "Magnetic clip-on sunglasses set",
    "Faux-leather AirPods slim case",
    "Reusable silk pillowcase (anti-frizz)",
  ],
  office: [
    "Under-desk cable management kit",
    "Wireless charging mousepad",
    "Adjustable monitor laptop riser",
    "Ergonomic gel wrist rest",
    "Magnetic monitor sticky-note board",
    "Foldable footrest under desk",
    "Phone holder clamp desktop",
    "Privacy desk divider acoustic",
    "Smart Pomodoro timer cube",
    "Magnetic stylus-pen organizer",
    "Memory-foam footrest",
    "Standing desk anti-fatigue mat",
  ],
  garden: [
    "Solar-powered garden path lights (6-pack)",
    "Self-watering plant pots (set of 4)",
    "Drip irrigation kit (DIY-25m)",
    "Telescopic adjustable rake",
    "Glow-in-the-dark plant labels",
    "Outdoor solar string lights (10m)",
    "Foldable garden kneeler bench",
    "Mini greenhouse stackable shelves",
    "Soil moisture tester (3-in-1)",
    "Adjustable garden hose nozzle",
    "Solar bird-bath fountain pump",
    "Heavy-duty garden gloves (touch)",
  ],
  travel: [
    "Cooling-gel memory-foam travel pillow",
    "Bluetooth selfie stick tripod combo",
    "Universal travel power adapter (60+)",
    "Compression packing cubes (set of 6)",
    "RFID-blocking neck wallet",
    "Foldable shoe dryer travel",
    "Smart luggage scale (handheld)",
    "Inflatable travel footrest",
    "Reusable silicone toiletry bottles",
    "Anti-theft slash-proof crossbody",
    "Microfiber travel towel quick-dry",
    "Lockable TSA luggage cable",
  ],
};

const DESCRIPTIONS_BY_NICHE: Record<Niche, string[]> = {
  pet: [
    "Quiet, app-controlled feed schedule with HD camera so you can check in mid-day.",
    "Ultra-tough rubber compound stands up to power chewers without splintering.",
    "Filtered fountain encourages reluctant drinkers to stay hydrated.",
    "Vet-recommended elevated bowl reduces neck strain for medium-to-large breeds.",
    "Vacuum attachment that lifts embedded hair from couches in one pass.",
    "GPS collar with live location tracking and a 30-day battery.",
  ],
  home: [
    "Stick-up LED strip with motion sensor; runs on USB-C for weeks per charge.",
    "Quiet HEPA filter removes 99% of allergens in personal-space footprint.",
    "Restores tired sweaters and couches by shaving lint and pilling in seconds.",
    "Hidden adhesive mount holds up to 8kg without screws or wall damage.",
    "Smart timer + low-noise so it doubles as a sleep aid.",
    "Reusable silicone insert keeps drains hair-free without chemicals.",
  ],
  wellness: [
    "Adjustable shoulder brace using magnetic pull to retrain spinal alignment.",
    "Heated eye massager with vibration and music modes for screen fatigue.",
    "Cordless percussion massager with quiet motor — gym-grade in a travel size.",
    "Memory-foam cervical pillow contoured for side and back sleepers.",
    "Compression knee wrap with adjustable heat for pre/post workout recovery.",
    "Acupressure mat for at-home tension relief in under 15 minutes.",
  ],
  beauty: [
    "Reusable up to 30 times — no glue, just magnetic lash + liquid liner.",
    "Replaces 1,000+ single-use cotton rounds with 8 silicone exfoliating pads.",
    "Seven-color LED light therapy mask for at-home anti-aging routine.",
    "Stainless ice roller chills in the freezer; depuffs in 60 seconds.",
    "Heatless overnight curls with silicone rods and silk tie set.",
    "Vibrating jade gua sha for daily lymphatic drainage.",
  ],
  kitchen: [
    "USB-rechargeable insulated mug that stirs and keeps drinks hot for 12 hours.",
    "Pack of 6 BPA-free silicone lids that fit any bowl, jar, or cut fruit.",
    "Reusable silicone food bags — replaces single-use plastic forever.",
    "Foldable dish rack expands across the sink; stores flat in a drawer.",
    "Bluetooth probe thermometer with app-paired temperature alerts.",
    "Magnetic measuring spoons stick to fridge — never lost.",
  ],
  fitness: [
    "11-piece resistance training kit with door anchor and ankle straps.",
    "Counter-equipped jump rope tracks reps even when cord is off.",
    "Adjustable kettlebell switches weights with a quick-twist mechanism.",
    "Acupressure mat for post-workout recovery — folds for travel.",
    "Doorway pull-up bar installs in 30 seconds without screws.",
    "Mini rebounder trampoline for low-impact cardio in any apartment.",
  ],
  tech: [
    "Extendable 65cm tripod with detachable Bluetooth shutter remote.",
    "Wrist-neutral vertical mouse with adjustable DPI and USB-C charging.",
    "UV-C sanitizer box doubles as a wireless phone charger.",
    "Foldable Bluetooth keyboard fits in a pocket; works with iOS/Android/macOS.",
    "Privacy webcam slider — magnetic micro-cover for laptops and tablets.",
    "USB-C hub with HDMI, ethernet, SD, and 100W passthrough power.",
  ],
  kids: [
    "Rechargeable side-LED kids sneakers with 7 color modes.",
    "Magnetic building blocks (100 pieces) that double as STEM intro.",
    "Educational busy-board for fine-motor skill development (toddler-friendly).",
    "Glow-in-the-dark drawing pad — no markers, no mess.",
    "STEM robot kit kids assemble themselves — 4 transformations.",
    "GPS kids smartwatch with two-way call and SOS button.",
  ],
  car: [
    "360° magnetic car phone holder with sticky 3M dashboard base.",
    "Collapsible 3-compartment trunk caddy with insulated cooler section.",
    "Handheld car vacuum with HEPA filter; corded for steady suction.",
    "Front-and-rear 1080p dash cam with G-sensor lock on impact.",
    "Adhesive LED interior strip with app-controlled colors.",
    "Universal sun shade umbrella — pops open under the windshield.",
  ],
  outdoor: [
    "210T parachute-nylon hammock with tree-strap kit; holds 200kg.",
    "Solar-charge LED lantern that inflates into a soft globe.",
    "Activated-carbon filter straw — drink from any stream safely.",
    "9-in-1 camping shovel multi-tool with hatchet, saw, and bottle opener.",
    "Foldable 10L bucket made of food-grade silicone; carries water or gear.",
    "Self-inflating sleeping pad — compresses to a 30cm tube.",
  ],
  fashion: [
    "20-30 mmHg graduated compression socks for nurses, flyers, standers.",
    "Magnetic pendant holds eyeglasses around your neck — no headache.",
    "No-buckle stretch belt — invisible under shirts, comfortable all day.",
    "Cordless USB-heated scarf with 3 warmth levels for cold commutes.",
    "Magnetic invisible bra strap — perfect for backless dresses.",
    "Foldable straw hat that springs back from a flat-packed shape.",
  ],
  office: [
    "Steel cable tray, adhesive clips, and velcro ties — hides 12+ cables.",
    "PU-leather mousepad with built-in 10W Qi wireless charger and LED edge.",
    "Adjustable laptop riser also serves as an under-screen storage tray.",
    "Memory-foam ergonomic gel wrist rest for keyboard and mouse.",
    "Magnetic sticky-note holder attaches to any iMac/monitor side.",
    "Smart Pomodoro cube — flip to start a 25/45-min focus block.",
  ],
  garden: [
    "Warm-white LED stake lights with built-in solar cells; auto-on at dusk.",
    "Capillary-action self-watering pots keep plants alive for 14 days unattended.",
    "Adjustable drip irrigation kit covers a 25m² garden bed.",
    "Telescopic rake reaches into hedges and corners without bending.",
    "Mini stackable greenhouse for seedlings — fits any balcony.",
    "3-in-1 soil moisture, pH, and light tester for healthier plants.",
  ],
  travel: [
    "Contoured U-shape neck pillow with cooling-gel insert and snap-buckle.",
    "Telescoping selfie stick + tripod combo with detachable Bluetooth remote.",
    "Universal adapter supporting 60+ countries; USB-C and 4x USB-A.",
    "Set of 6 compression packing cubes — fits a 30L carry-on perfectly.",
    "RFID-blocking neck wallet hides passport, cash, and cards under shirt.",
    "Anti-theft crossbody with slash-proof strap and lockable zips.",
  ],
};

// Verdict distribution target across the full dataset
const TARGET_DISTRIBUTION: Record<Verdict, number> = {
  go: 18,
  test: 52,
  risky: 36,
  skip: 14,
};

const COUNTRIES = [
  "US", "UK", "DE", "FR", "ES", "IT", "NL", "SE", "AT", "CH",
  "CA", "AU", "IE", "HR", "RS",
] as const;
const SOURCES_LIST: Source[] = ["aliexpress", "temu", "amazon"];
const TREND_BY_VERDICT = {
  go: "climbing" as const,
  test: "flat" as const,
  risky: "declining" as const,
  skip: "dead" as const,
};

function scoreForVerdict(verdict: Verdict, seed: number): number {
  const center: Record<Verdict, number> = {
    go: 85,
    test: 70,
    risky: 50,
    skip: 28,
  };
  const jitter = Math.round((rng(seed) - 0.5) * 8);
  return Math.max(0, Math.min(100, center[verdict] + jitter));
}

function pillarsFor(score: number, seed: number): Product["pillars"] {
  const jit = (base: number, k: number) =>
    Math.max(0, Math.min(100, base + Math.round((rng(seed + k) - 0.5) * 22)));
  return {
    margin: jit(score, 1),
    marketFit: jit(score, 2),
    demand: jit(score, 3),
    competition: jit(score, 4),
    creative: jit(score, 5),
  };
}

function reasoningFor(
  verdict: Verdict,
  name: string,
  countryCode: string,
  seed: number,
): ProductReasoning {
  const whyPool: Record<Verdict, string[]> = {
    go: [
      "7x+ markup possible — clear room for paid acquisition CPA.",
      `Demand signal aligns with ${countryCode} top-platform.`,
      "Strong before/after creative angle writes itself.",
      "Evergreen problem with rising search interest.",
    ],
    test: [
      "4–5x markup leaves a healthy ad-budget headroom.",
      `Niche heat is solid in ${countryCode}; ride the current trend window.`,
      "Bundle upsells unlock the AOV ceiling.",
      "Demo-able in ≤30 seconds — perfect for UGC creators.",
    ],
    risky: [
      "Saturation is real; one-strong-angle creative is mandatory.",
      `${countryCode} buyers need premium framing to absorb price.`,
      "Margin is tight; ad math depends on a low CPA.",
    ],
    skip: [
      "Below the 3x markup floor — paid acquisition won't work.",
      `Saturated category in ${countryCode}; commodity pricing.`,
      "Trend cycle peaked; expect declining CTR week-over-week.",
    ],
  };
  const flagPool: Record<Verdict, string[]> = {
    go: ["Copycats will swarm fast — capture demand quickly."],
    test: [
      "Sizing returns can spike if the strap doesn't fit modern fits.",
      "Watch saturation creeping in over the next 4–6 weeks.",
    ],
    risky: [
      "Amazon already owns the search-driven segment.",
      "Bulky shipping eats margin without a US/EU 3PL.",
      "Creative pool is fatigued — needs sustained R&D.",
    ],
    skip: [
      "Category peaked years ago — no organic pull.",
      "Pharmacies / big-box retail beats DTC on price.",
    ],
  };
  const anglePool: Record<Verdict, string[]> = {
    go: [
      "First-person UGC: relatable creator films day-1 vs day-7 reveal.",
      "Split-screen demo of the product's strongest visible benefit.",
      "Founder voiceover: 'I built this because I had the same problem.'",
    ],
    test: [
      "Pain-point hook in the first 3 seconds, then product reveal.",
      "Time-lapse before/after with ASMR product sound design.",
      "Side-by-side comparison vs the generic alternative.",
    ],
    risky: [
      "Try a vet/dietitian/expert-authority angle to break trust gates.",
      "Lead with the specific niche pain — broad ads will burn budget.",
    ],
    skip: ["Skip — channel ad budget toward higher-LTV items."],
  };
  const why = whyPool[verdict];
  const flags = flagPool[verdict];
  const angles = anglePool[verdict];

  const whyTest = [
    why[seed % why.length],
    why[(seed + 1) % why.length],
    why[(seed + 2) % why.length],
  ].slice(0, verdict === "skip" ? 0 : verdict === "risky" ? 2 : 3);
  const redFlags = [
    flags[seed % flags.length],
    flags[(seed + 1) % flags.length],
  ].slice(0, verdict === "go" ? 1 : verdict === "skip" ? 2 : 2);
  const topAngle = angles[seed % angles.length] + ` Target: ${name}.`;

  return { whyTest, redFlags, topAngle };
}

function makeProduct(
  n: number,
  niche: Niche,
  verdict: Verdict,
  variantIndex: number,
): Product {
  const names = NAMES_BY_NICHE[niche];
  const descs = DESCRIPTIONS_BY_NICHE[niche];
  const name = names[variantIndex % names.length];
  const description = descs[variantIndex % descs.length];

  const seed = n;
  const score = scoreForVerdict(verdict, seed);
  const country = COUNTRIES[seed % COUNTRIES.length];
  const source = SOURCES_LIST[seed % SOURCES_LIST.length];

  const costBase: Record<Niche, [number, number]> = {
    pet: [4, 14],
    home: [2, 10],
    wellness: [5, 14],
    beauty: [3, 11],
    kitchen: [4, 12],
    fitness: [5, 13],
    tech: [5, 16],
    kids: [4, 13],
    car: [5, 12],
    outdoor: [6, 15],
    fashion: [4, 11],
    office: [5, 14],
    garden: [6, 14],
    travel: [4, 12],
  };
  const [lo, hi] = costBase[niche];
  const costUSD = Number((lo + rng(seed * 3) * (hi - lo)).toFixed(2));
  const markup = 3 + rng(seed * 7) * 4; // 3x–7x
  const suggestedPriceUSD = Number((costUSD * markup).toFixed(2));
  const shippingCostUSD = Number((1.2 + rng(seed * 11) * 3.2).toFixed(2));

  return {
    id: id(n),
    name,
    description,
    image: imageForNiche(niche, n + variantIndex),
    category: niche,
    costUSD,
    suggestedPriceUSD,
    shippingCostUSD,
    source,
    sourceUrl: `https://${source === "aliexpress" ? "aliexpress.com" : source === "temu" ? "temu.com" : "amazon.com"}/item/${id(n)}`,
    targetCountry: country,
    sellScore: score,
    verdict: verdictFromScore(score),
    pillars: pillarsFor(score, seed),
    reasoning: reasoningFor(verdict, name, country, seed),
    demandTrend: makeTrend(seed, TREND_BY_VERDICT[verdict]),
    isFavorite: false,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function buildSeed(): Product[] {
  const NICHES: Niche[] = [
    "pet", "home", "wellness", "beauty", "kitchen", "fitness", "tech",
    "kids", "car", "outdoor", "fashion", "office", "garden", "travel",
  ];
  const out: Product[] = [];
  let counter = 1;

  for (const verdict of ["go", "test", "risky", "skip"] as const) {
    const target = TARGET_DISTRIBUTION[verdict];
    for (let i = 0; i < target; i++) {
      const niche = NICHES[i % NICHES.length];
      const variantIndex = Math.floor(i / NICHES.length);
      out.push(makeProduct(counter, niche, verdict, variantIndex));
      counter++;
    }
  }
  return out;
}

export const SEED_PRODUCTS: Product[] = buildSeed();

export const SEED_COUNTS: Record<Verdict, number> = SEED_PRODUCTS.reduce(
  (acc, p) => {
    acc[p.verdict] = (acc[p.verdict] ?? 0) + 1;
    return acc;
  },
  { go: 0, test: 0, risky: 0, skip: 0 } as Record<Verdict, number>,
);

export const SEED_TOTAL = SEED_PRODUCTS.length;
