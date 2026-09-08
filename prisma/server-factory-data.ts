// AUTO-DOCUMENTED from "server factory description.xlsx" (sheets: DELL, HP).
//
// Source layout: each sheet is transposed — one row per spec (form factor,
// processor, memory, storage, power supply, warranty), one column per
// configuration. Several columns share a product name (e.g. "R730" appears
// in 3 columns), which is a Basic/Intermediate/Advanced progression — that
// maps directly onto this schema's ProductTier system.
//
// Excluded from this file (present in the sheet, no usable spec data — just
// a product name and, in a couple of cases, one stray number):
//   DELL: "DELL R750", "DELL R650"
//   HP:   "DL580 GEN 10", "DL380 GEN 10 PLUS", "DL380 GEN 11"
// Go back to whoever supplied the sheet if these need to be included.
//
// NOT in the source at all — every product below is seeded with basePrice: 0
// and isActive: false so nothing with a fabricated price can go live. Set
// real prices in Admin → Products and flip Active once priced.
//
// Two configs (Dell R740 "Advanced", HP DL380 Gen 10 "Advanced") have no
// processor listed in the source column — left unset here rather than
// guessed; the Configurator falls back to the product's default processor
// for that tier. Worth checking with the source of the sheet.
//
// Normalizations applied (spacing/casing/expansion only, no specs added):
//   "E5-2670 V3 X 2"      -> "Intel Xeon E5-2670 v3 × 2"
//   "GOLD 6138 X 4"       -> "Intel Xeon Gold 6138 × 4"        (unambiguous Intel Xeon Scalable SKUs)
//   "DUAL "                -> "Dual Power Supply"
//   "1YEAR" / "1 YEAR"     -> "1-Year Warranty"
//   bare "2TB SAS "        -> "2TB SAS HDD"                     (the sheet itself always writes
//                                                                 "SAS SSD" when it means SSD, so
//                                                                 bare "SAS" follows its own convention for HDD)

export type SeedTierConfig = {
  /** undefined = not specified in the source for this configuration. */
  processor?: string;
  memory?: string;
  storage?: string;
};

export type SeedServerProduct = {
  sku: string;
  name: string;
  slug: string;
  brand: 'Dell' | 'HP';
  /** Constant across every configuration of this product, where the source specified it. */
  formFactor?: string;
  powerSupply?: string;
  warranty?: string;
  /** 1 entry = single fixed build (no tiers). 2–3 entries = BASIC/INTERMEDIATE/[ADVANCED]. */
  configs: SeedTierConfig[];
};

export const serverProducts: SeedServerProduct[] = [
  {
    sku: 'DELL-R730',
    name: 'Dell PowerEdge R730',
    slug: 'dell-poweredge-r730',
    brand: 'Dell',
    formFactor: '2U',
    powerSupply: 'Dual Power Supply',
    warranty: '1-Year Warranty',
    configs: [
      { processor: 'Intel Xeon E5-2670 v3 × 2', memory: '64GB DDR4 RAM', storage: '2TB SAS HDD' },
      { processor: 'Intel Xeon E5-2680 v4 × 2', memory: '128GB DDR4 RAM', storage: '2TB SAS HDD' },
      { processor: 'Intel Xeon E5-2699 v4 × 2', memory: '256GB DDR4 RAM', storage: '3.6TB SAS HDD' },
    ],
  },
  {
    sku: 'DELL-R740',
    name: 'Dell PowerEdge R740',
    slug: 'dell-poweredge-r740',
    brand: 'Dell',
    formFactor: '2U',
    powerSupply: 'Dual Power Supply',
    warranty: '1-Year Warranty',
    configs: [
      { processor: 'Intel Xeon Gold 6138 × 2', memory: '128GB DDR4 RAM', storage: '2.4TB SAS HDD' },
      { processor: 'Intel Xeon Platinum 8173M × 2', memory: '256GB DDR4 RAM', storage: '3.6TB SAS HDD' },
      // processor not specified in source for this configuration — see file header
      { memory: '512GB DDR4 RAM', storage: '960GB SAS SSD × 2 + 3.6TB SAS HDD' },
    ],
  },
  {
    sku: 'DELL-R840',
    name: 'Dell PowerEdge R840',
    slug: 'dell-poweredge-r840',
    brand: 'Dell',
    formFactor: '2U',
    powerSupply: 'Dual Power Supply',
    warranty: '1-Year Warranty',
    configs: [
      { processor: 'Intel Xeon Gold 6138 × 4', memory: '512GB DDR4 RAM', storage: '960GB SAS SSD × 2 + 2TB SAS HDD × 3' },
    ],
  },
  {
    sku: 'DELL-R940',
    name: 'Dell PowerEdge R940',
    slug: 'dell-poweredge-r940',
    brand: 'Dell',
    // form factor and power supply omitted — source had a stray "3" / was blank, not a real value
    warranty: '1-Year Warranty',
    configs: [
      { processor: 'Intel Xeon Gold 6138 × 4', memory: '512GB DDR4 RAM', storage: '960GB SAS SSD × 2 + 2TB SAS HDD × 3' },
    ],
  },
  {
    sku: 'HP-DL380-G9',
    name: 'HP ProLiant DL380 G9',
    slug: 'hp-proliant-dl380-g9',
    brand: 'HP',
    formFactor: '2U',
    powerSupply: 'Dual Power Supply',
    warranty: '1-Year Warranty',
    configs: [
      { processor: 'Intel Xeon E5-2670 v3 × 2', memory: '64GB DDR4 RAM', storage: '2TB SAS HDD' },
      { processor: 'Intel Xeon E5-2680 v4 × 2', memory: '128GB DDR4 RAM', storage: '2TB SAS HDD' },
      { processor: 'Intel Xeon E5-2699 v4 × 2', memory: '256GB DDR4 RAM', storage: '3.6TB SAS HDD' },
    ],
  },
  {
    sku: 'HP-DL380-GEN10',
    name: 'HP ProLiant DL380 Gen 10',
    slug: 'hp-proliant-dl380-gen10',
    brand: 'HP',
    formFactor: '2U',
    powerSupply: 'Dual Power Supply',
    warranty: '1-Year Warranty',
    configs: [
      { processor: 'Intel Xeon Gold 6138 × 2', memory: '128GB DDR4 RAM', storage: '2.4TB SAS HDD' },
      { processor: 'Intel Xeon Platinum 8173M × 2', memory: '256GB DDR4 RAM', storage: '3.6TB SAS HDD' },
      // processor not specified in source for this configuration — see file header
      { memory: '512GB DDR4 RAM', storage: '960GB SAS SSD × 2 + 3.6TB SAS HDD' },
    ],
  },
  {
    sku: 'HP-DL560-GEN10',
    name: 'HP ProLiant DL560 Gen 10',
    slug: 'hp-proliant-dl560-gen10',
    brand: 'HP',
    formFactor: '2U',
    powerSupply: 'Dual Power Supply',
    warranty: '1-Year Warranty',
    configs: [
      { processor: 'Intel Xeon Gold 6138 × 4', memory: '512GB DDR4 RAM', storage: '960GB SAS SSD × 2 + 2TB SAS HDD × 3' },
      { processor: 'Intel Xeon Platinum 8173M × 4', memory: '1TB DDR4 RAM', storage: '960GB SAS SSD × 2 + 2TB SAS HDD × 3' },
    ],
  },
];
