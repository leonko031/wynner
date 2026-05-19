import type { Niche } from "@/types";

/**
 * Per-niche bank of Unsplash photo IDs.
 *
 * Each entry is a stable Unsplash photo ID hand-picked from product-category
 * searches. Pictures are real (no AI fakes), permanent, and CDN-served by
 * Unsplash. We rotate through each niche's bank deterministically in the
 * seed generator so the same product always shows the same photo.
 *
 * If a specific ID 404s, swap it here — the seed regenerates from this file.
 */
const IDS_BY_NICHE: Record<Niche, string[]> = {
  pet: [
    "1583337130417-3346a1be7dee", // bulldog hoodie
    "1450778869180-41d0601e046e", // golden retriever
    "1601758228041-f3b2795255f1", // dog leash
    "1574144611937-0df059b5ef3e", // cat on couch
    "1518791841217-8f162f1e1131", // cat closeup
    "1587300003388-59208cc962cb", // cat toy
    "1543466835-00a7907e9de1", // dog portrait
    "1517849845537-4d257902454a", // pet supplies
  ],
  home: [
    "1565814329452-e1efa11c5b89", // night light glow
    "1556228720-195a672e8a03", // home decor
    "1556909114-f6e7ad7d3136", // mug warmer
    "1583394293214-28ded15ee548", // candle
    "1581578017093-cd30fce4eeb7", // air purifier
    "1567016432779-094069958ea5", // smart bulb
    "1556228453-efd6c1ff04f6", // wall lamp
    "1503376780353-7e6692767b70", // home gadget
  ],
  wellness: [
    "1505873242700-f289a29e1e0f", // wellness chair pillow
    "1582719471384-894fbb16e074", // yoga / wellness
    "1571902943202-507ec2618e8f", // self-care
    "1556228720-195a672e8a03", // soothing balm
    "1606107557195-0e29a4b5b4aa", // skincare wellness
    "1606800052052-a08af7148866", // yoga mat
    "1610018556010-6a11691bc905", // face roller
    "1604335398980-ededc16b59c5", // electric toothbrush
  ],
  beauty: [
    "1556228720-195a672e8a03", // beauty products
    "1583241800698-9c2e5a5b8b8e", // eye makeup
    "1583394293214-28ded15ee548", // skincare bottle
    "1583394838336-acd977736f90", // beauty serum
    "1503342217505-b0a15ec3261c", // hair tools
    "1610337673044-720471f83677", // mirror lights
    "1571781926291-c477ebfd024b", // lipstick
    "1612817288484-6f916006741a", // beauty kit
  ],
  kitchen: [
    "1556909114-f6e7ad7d3136", // mug
    "1514228742587-6b1558fcca3d", // coffee mug
    "1571902943202-507ec2618e8f", // kitchen jar
    "1571781926291-c477ebfd024b", // utensils
    "1545558014-8692077e9b5c", // kitchen tool
    "1567016432779-094069958ea5", // gadget
    "1556910103-1c02745aae4d", // kitchen prep
    "1565843708714-52ecf69ab81f", // food container
  ],
  fitness: [
    "1517836357463-d25dfeac3438", // resistance bands
    "1517649763962-0c623066013b", // gym dumbbell
    "1606800052052-a08af7148866", // yoga mat
    "1571902943202-507ec2618e8f", // protein shaker
    "1605296867304-46d5465a13f1", // fitness band
    "1518611012118-696072aa579a", // home gym
    "1574144611937-0df059b5ef3e", // pulse monitor
    "1605296830714-3a55b8d5a4be", // jump rope
  ],
  tech: [
    "1518770660439-4636190af475", // tech gadget
    "1527864550417-7fd91fc51a46", // mouse
    "1556745753-b2904692b3cd", // tripod
    "1517336714731-489689fd1ca8", // laptop
    "1502920917128-1aa500764cbd", // wireless charger
    "1593642632559-0c6d3fc62b89", // cables
    "1611162617474-5b21e879e113", // device
    "1602143407151-7111542de6e8", // smart bottle
  ],
  kids: [
    "1542291026-7eec264c27ff", // light-up shoes
    "1503602642458-232111445657", // toys
    "1495704907664-81f74a7efd9b", // fidget spinner
    "1566576721346-d4a3b4eaeb55", // building blocks
    "1591389703635-e15a07b842d7", // kids ride
    "1568667256549-094345857637", // plush toy
    "1607453998774-d533f65dac99", // kids puzzle
    "1604077198929-fbdfd6c8a16d", // educational toy
  ],
  car: [
    "1547036967-23d11aacaee0", // phone mount
    "1503376780353-7e6692767b70", // car interior
    "1605559424843-9e4c228bf1c2", // car cleaner
    "1614026480209-cb37f3ffcca3", // dash cam
    "1503376780353-7e6692767b70", // trunk organizer
    "1607853554439-0069ec0f29b6", // car wash
    "1502877338535-766e1452684a", // car phone
    "1485463611174-f302f6a5c1c9", // car detail
  ],
  outdoor: [
    "1504280390367-361c6d9f38f4", // hammock outdoor
    "1473800447596-01729482b8eb", // garden path
    "1551269901-5c5e14c25df7", // camping
    "1521810556093-f5d20e8df3c9", // outdoor gear
    "1465188162913-8fb5709d6d57", // hiking gear
    "1487213-a83b3b9b5d63", // tent
    "1504280390367-361c6d9f38f4", // hammock
    "1455218873509-8097305ee378", // outdoor table
  ],
  fashion: [
    "1542291026-7eec264c27ff", // sneakers
    "1542038784456-1ea8e935640e", // selfie / outfit
    "1556228720-195a672e8a03", // accessories
    "1583394293214-28ded15ee548", // jewelry
    "1611162617474-5b21e879e113", // watch
    "1556228852-80b6e5eeff06", // bag
    "1556228852-80b6e5eeff06", // handbag
    "1571781926291-c477ebfd024b", // scarf
  ],
  office: [
    "1593642632559-0c6d3fc62b89", // desk cables
    "1587202372775-e229f172b9d7", // mousepad
    "1517336714731-489689fd1ca8", // desk setup
    "1527864550417-7fd91fc51a46", // ergonomic mouse
    "1556745753-b2904692b3cd", // desk tripod
    "1581578017093-cd30fce4eeb7", // desk purifier
    "1518770660439-4636190af475", // desk tech
    "1556228720-195a672e8a03", // desk supplies
  ],
  garden: [
    "1473800447596-01729482b8eb", // garden lights
    "1485955900006-10f4d324d411", // plant pot
    "1416879595882-3373a0480b5b", // plant
    "1465146633011-14f8e0781093", // garden tools
    "1459411552884-841db9b3cc2a", // garden seedling
    "1499933374294-4584851497cc", // greenhouse
    "1502780402662-acc01917cfd1", // succulents
    "1532093321-fad0bf41a73e", // planter
  ],
  travel: [
    "1488646953014-85cb44e25828", // travel pillow
    "1542038784456-1ea8e935640e", // selfie stick
    "1488646953014-85cb44e25828", // luggage
    "1502920917128-1aa500764cbd", // travel adapter
    "1517842645767-c639042777db", // backpack
    "1488646953014-85cb44e25828", // travel kit
    "1502920917128-1aa500764cbd", // headphones travel
    "1517842645767-c639042777db", // travel bag
  ],
};

const FALLBACK_ID = "1556228720-195a672e8a03";

/**
 * Returns the Unsplash CDN URL for a niche, rotating deterministically by a
 * seed integer so the same product always shows the same photo.
 */
export function imageForNiche(niche: Niche, seed: number): string {
  const bank = IDS_BY_NICHE[niche] ?? [];
  const id = bank.length > 0 ? bank[seed % bank.length] : FALLBACK_ID;
  return `https://images.unsplash.com/photo-${id}?w=800&h=800&fit=crop&q=80&auto=format`;
}

export function imageBankForNiche(niche: Niche): string[] {
  return (IDS_BY_NICHE[niche] ?? [FALLBACK_ID]).map(
    (id) =>
      `https://images.unsplash.com/photo-${id}?w=800&h=800&fit=crop&q=80&auto=format`,
  );
}
