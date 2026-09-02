/** Content blocks a section can contain. Kept deliberately small: paragraphs,
 *  lists, numbered steps, comparison tables and pull-quotes cover every guide
 *  so far. Add a block type only when a post actually needs it. */
export type Block =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "steps"; items: { title: string; text: string }[] }
  | { type: "table"; caption: string; head: string[]; rows: string[][] }
  | { type: "quote"; text: string; cite?: string }
  | { type: "note"; title: string; text: string };

export type BlogSection = {
  /** Phrased as the question a reader (or an answer engine) would ask. */
  heading: string;
  blocks: Block[];
};

export type Faq = { question: string; answer: string };

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  updatedAt?: string;
  image: string;
  imageAlt: string;
  featured?: boolean;
  keywords: string[];
  /** One direct, self-contained answer to the title question (40–70 words). */
  quickAnswer: string;
  /** Scannable key points; doubles as the article abstract for AI crawlers. */
  quickTake: string[];
  sections: BlogSection[];
  faqs: Faq[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "how-much-is-my-boat-worth",
    title: "How much is my boat worth? A practical valuation guide",
    description:
      "Learn which details shape a boat's market value, how to read comparable listings and what to prepare before requesting a valuation.",
    category: "Valuation",
    publishedAt: "2026-09-02",
    image: "/cards/card-4.png",
    imageAlt: "Modern motor yacht underway on open water",
    featured: true,
    keywords: ["boat valuation", "how much is my boat worth", "boat market value", "yacht appraisal", "comparable boat listings"],
    quickAnswer:
      "A boat is worth what a buyer will pay for a comparable boat today, adjusted for condition, equipment, location and how quickly you need to sell. Start from current and recently sold listings of the same make, model and age, then adjust for the differences a buyer can verify. Expect a realistic range rather than a single number.",
    quickTake: [
      "Market first: recent comparable listings matter more than what you paid.",
      "Condition and paperwork move the price more than most extras do.",
      "Asking prices are signals, not proof. Sold prices are the real anchor.",
      "Location, season and urgency all shift the range.",
      "A documented, well-presented boat earns buyer confidence, and confidence is what they pay for.",
    ],
    sections: [
      {
        heading: "Why doesn't the purchase price tell you what your boat is worth?",
        blocks: [
          {
            type: "p",
            text: "What you paid is part of your ownership history, but buyers compare the boat with what is available now. A strong valuation starts with recent and current listings for the same make, model, age and size, then adjusts for the differences a buyer can see.",
          },
          {
            type: "p",
            text: "Asking prices are useful signals, not proof of value. Boats may be listed above the price they eventually achieve, and two apparently similar vessels can have very different maintenance histories. That is why a range is usually more honest than a single, overly precise number.",
          },
        ],
      },
      {
        heading: "Which details move a boat valuation the most?",
        blocks: [
          {
            type: "p",
            text: "The biggest changes in value usually come from the boat's condition, specification and sale context. Buyers pay for confidence as much as equipment, so clear evidence can be as important as the equipment itself.",
          },
          {
            type: "table",
            caption: "Valuation factors and how they typically affect price",
            head: ["Factor", "Typical effect", "What buyers look for"],
            rows: [
              ["Make, model, year and length", "Sets the baseline range", "Reputation, resale demand, build quality"],
              ["Engine hours and service history", "Large", "Invoices, dated records, recent major work"],
              ["Hull, deck and interior condition", "Large", "Osmosis, gelcoat, upholstery, odours"],
              ["Electronics and extras", "Moderate, rarely full retail", "Age, brand, whether it removes a purchase"],
              ["Location and season", "Moderate", "Ease of viewing, cost to relocate, local demand"],
              ["Urgency of the sale", "Moderate", "A quick sale usually means pricing inside the range"],
            ],
          },
        ],
      },
      {
        heading: "How do you use comparable listings well?",
        blocks: [
          {
            type: "p",
            text: "Begin narrowly: the same model and a similar build year. If there are too few examples, widen the search to closely related models with similar dimensions, engines and buyer appeal. Compare like with like and note every meaningful difference before adjusting your range.",
          },
          {
            type: "p",
            text: "A newer chartplotter rarely adds its full retail cost to the selling price. On the other hand, a documented engine overhaul or a recently renewed standing rig may remove a major concern for the buyer. Think in terms of risk reduced, not money spent.",
          },
          {
            type: "quote",
            text: "Buyers do not pay for what you spent. They pay for the worries you have taken away.",
          },
        ],
      },
      {
        heading: "What should you prepare before asking for a valuation?",
        blocks: [
          {
            type: "p",
            text: "A transparent brief helps the person valuing the boat distinguish a well-kept example from an average listing. Gather the following before you ask:",
          },
          {
            type: "list",
            items: [
              "Registration or build details, including hull identification number",
              "Engine make, model, hours and the date of the last service",
              "Current location and whether the boat is afloat or ashore",
              "A short equipment list with the age of major items",
              "Recent photographs in good light, inside and out",
              "Service records and a note of any known faults",
            ],
          },
          {
            type: "note",
            title: "What a good first range does",
            text: "It helps you decide what to do next: prepare the boat, test the market, adjust timing or begin a managed sale. It should not pressure you into an attractive but unsupported asking price.",
          },
        ],
      },
    ],
    faqs: [
      {
        question: "Is an online boat valuation accurate?",
        answer:
          "Online estimates are a starting point. They rely on listing data and cannot see condition, service history or local demand. Treat them as a wide range and refine it with comparable boats and a look at your own documentation.",
      },
      {
        question: "How much do engine hours affect a boat's value?",
        answer:
          "Hours matter most when they are high for the boat's age or undocumented. Well-serviced engines with moderate hours usually hold value better than low-hour engines that sat unused, because buyers worry about neglect as much as wear.",
      },
      {
        question: "Should I price my boat above the valuation to leave room to negotiate?",
        answer:
          "Only slightly, if at all. Boats priced clearly above comparable listings attract fewer enquiries and sit longer, which itself lowers the eventual price. Pricing inside a credible range usually produces more viewings and stronger offers.",
      },
      {
        question: "Does the season affect what my boat is worth?",
        answer:
          "Yes. Demand is typically stronger in spring and early summer in most markets, and boats that can be viewed and trialled easily attract more interest. A boat listed out of season may need a sharper price or a longer timeline.",
      },
      {
        question: "How does BoatUneet value a boat?",
        answer:
          "We ask a few questions about the boat, compare it with current and recently sold examples, and send a market-informed price range by email, free and without obligation, usually within two business days.",
      },
    ],
  },
  {
    slug: "boat-selling-documents-checklist",
    title: "What documents do you need to sell a boat? The complete checklist",
    description:
      "A clear checklist of ownership, tax, maintenance and transaction records to organise before you put a boat on the market.",
    category: "Preparation",
    publishedAt: "2026-08-26",
    image: "/cards/card-2.png",
    imageAlt: "White motor yacht moored in a marina",
    keywords: ["boat selling documents", "documents needed to sell a boat", "boat bill of sale", "yacht VAT evidence", "boat registration transfer"],
    quickAnswer:
      "To sell a boat you typically need proof of ownership and registration, the builder's certificate where available, previous bills of sale, VAT or sales-tax evidence, evidence that any finance is cleared, current safety and radio certificates, and a maintenance history with an equipment inventory. Exact requirements vary by flag and location, so confirm the final set with whoever handles settlement.",
    quickTake: [
      "Paperwork decides whether buyer enthusiasm can progress to a sale.",
      "Ownership, tax, compliance and maintenance are the four document groups.",
      "Missing VAT evidence is the most common late-stage surprise.",
      "A tidy digital folder with a one-page index answers questions in minutes.",
      "Requirements vary by flag and country. This is a preparation checklist, not legal advice.",
    ],
    sections: [
      {
        heading: "Why does the paperwork matter so early in a boat sale?",
        blocks: [
          {
            type: "p",
            text: "A buyer can become enthusiastic in an afternoon, but documentation determines whether that interest can progress. Missing ownership records, unclear tax status or an incomplete service history can slow due diligence just when momentum matters most.",
          },
          {
            type: "p",
            text: "Requirements vary by flag, location and transaction, so this is a preparation checklist rather than legal advice. Confirm the final document set with the professionals handling your sale and settlement.",
          },
        ],
      },
      {
        heading: "Which ownership and identity records do buyers expect?",
        blocks: [
          {
            type: "p",
            text: "Start with the documents that show what the vessel is and that you are entitled to sell it. Keep clear scans, but retain the originals securely for the closing process.",
          },
          {
            type: "list",
            items: [
              "Current registration or flag certificate",
              "Builder's certificate or certificate of origin, where available",
              "Previous bills of sale and the current proof of ownership",
              "Hull identification and engine serial numbers",
              "Evidence of any mortgage discharge or other cleared finance",
            ],
          },
        ],
      },
      {
        heading: "What tax and compliance evidence will a buyer ask for?",
        blocks: [
          {
            type: "p",
            text: "Buyers may need evidence of VAT, sales tax, import status or other local obligations. The exact evidence depends on the boat's history and where the transaction takes place. Gather what you have rather than waiting for an offer to expose a gap.",
          },
          {
            type: "table",
            caption: "Tax and compliance documents by purpose",
            head: ["Document", "Why it matters", "Where it usually comes from"],
            rows: [
              ["VAT or sales-tax evidence", "Confirms tax status for the buyer's market", "Original invoice, customs paperwork, previous sale"],
              ["Import or customs records", "Shows the boat is legally in its current location", "Customs authority, shipping agent"],
              ["Safety and radio certificates", "Required for many flags and for insurance", "Surveyor, flag authority, radio licensing body"],
              ["Insurance records", "Shows continuity and any material claims", "Your insurer"],
            ],
          },
        ],
      },
      {
        heading: "How should you organise maintenance records and the inventory?",
        blocks: [
          {
            type: "p",
            text: "Service invoices, engine-hour records and a dated inventory help a buyer understand both condition and value. Note equipment that is excluded from the sale so there is no ambiguity during inspection or handover.",
          },
          {
            type: "steps",
            items: [
              { title: "Create one digital folder", text: "Separate ownership records from service history so nothing sensitive is sent before a buyer is screened." },
              { title: "Use consistent filenames", text: "Date first, then document type. Buyers and brokers can find what they need without asking." },
              { title: "Write a one-page index", text: "List every document and its date. It becomes the first thing you send to a serious enquiry." },
              { title: "Mark what is excluded", text: "Personal gear, tenders or electronics that leave with you should be listed clearly." },
            ],
          },
        ],
      },
    ],
    faqs: [
      {
        question: "Can I sell a boat without the original bill of sale?",
        answer:
          "Often yes, but it depends on the flag and the buyer's lender or insurer. Registration documents plus a clear chain of ownership may be enough. Expect more questions and possibly a statutory declaration if the paper trail has gaps.",
      },
      {
        question: "What happens if I cannot prove the boat's VAT status?",
        answer:
          "Buyers in VAT jurisdictions may reduce their offer or walk away, because they could become liable for the tax. Gather the original purchase invoice, customs paperwork or evidence from a previous owner before listing rather than after an offer.",
      },
      {
        question: "Do I need a recent survey to sell my boat?",
        answer:
          "No. Buyers usually commission their own survey. A recent report can help set an honest asking price and reassure early enquiries, but it rarely replaces the buyer's own inspection.",
      },
      {
        question: "Should I send documents to every enquiry?",
        answer:
          "Share a one-page index and non-sensitive items first. Registration numbers, invoices and personal details should go to buyers who have been screened and are progressing to an offer or survey.",
      },
    ],
  },
  {
    slug: "yacht-broker-commission-explained",
    title: "How much is yacht broker commission, and what should sellers compare?",
    description:
      "Understand headline commission rates, buyer-broker splits, third-party costs and the questions to ask before signing a selling agreement.",
    category: "Costs",
    publishedAt: "2026-08-19",
    image: "/cards/card-6.png",
    imageAlt: "Large yacht cruising along a mountainous coast",
    keywords: ["yacht broker commission", "boat broker fees", "how much do yacht brokers charge", "brokerage agreement", "cost of selling a boat"],
    quickAnswer:
      "Traditional yacht brokers usually charge a commission of roughly 8 to 10 percent of the final sale price, often with a minimum fee, and the commission may be shared with a buyer's broker. Compare the net amount you keep, the work included and every separately charged cost, not only the headline percentage. BoatUneet charges a 2.5 percent success fee for a managed sale.",
    quickTake: [
      "The headline percentage is only part of the cost of selling.",
      "Ask when the fee is earned and whether a buyer's broker shares it.",
      "Photography, listing, screening and viewings should be spelled out.",
      "Model the net proceeds at one realistic price for every option.",
      "Read the agreement for exclusivity, duration and cancellation terms.",
    ],
    sections: [
      {
        heading: "Why does a commission percentage only tell part of the story?",
        blocks: [
          {
            type: "p",
            text: "Traditional yacht brokerage fees are often presented as a percentage of the final sale price. The agreement should also explain when the fee is earned, whether another broker may share it and what happens if a buyer introduced during the agreement completes later.",
          },
          {
            type: "p",
            text: "Rates and practices vary by market, vessel and contract. Read the actual agreement carefully and ask for written answers where the commercial terms are unclear.",
          },
        ],
      },
      {
        heading: "What should you compare between selling options?",
        blocks: [
          {
            type: "p",
            text: "A lower percentage is valuable only if the service still covers the work needed to reach and complete with a qualified buyer. Ask each provider to describe the process, deliverables and responsibilities in plain language.",
          },
          {
            type: "list",
            items: [
              "The success fee or commission and the event that makes it payable",
              "Photography, listing preparation and marketplace distribution",
              "Enquiry screening, viewings, inspections and sea trials",
              "Buyer-broker participation and any effect on your net proceeds",
              "Settlement, legal, survey, tax and other third-party costs",
              "Agreement duration, exclusivity and cancellation terms",
            ],
          },
        ],
      },
      {
        heading: "How do you model the net proceeds of a boat sale?",
        blocks: [
          {
            type: "p",
            text: "Use the same realistic selling price for every comparison. Subtract the main service fee and list the other likely costs separately. This turns an abstract percentage into the amount that matters: what remains with you after a successful transaction.",
          },
          {
            type: "table",
            caption: "Illustrative net proceeds on a €100,000 sale (excluding third-party costs)",
            head: ["Selling route", "Fee", "Fee on €100,000", "You keep"],
            rows: [
              ["Traditional brokerage", "10%", "€10,000", "€90,000"],
              ["Traditional brokerage", "8%", "€8,000", "€92,000"],
              ["BoatUneet managed sale", "2.5% success fee", "€2,500", "€97,500"],
              ["Private sale", "0% (your time and costs)", "€0", "€100,000 minus your costs"],
            ],
          },
          {
            type: "p",
            text: "Also consider the cost of time. A plan that makes pricing decisions, enquiry status and next actions visible can be easier to manage than an arrangement where activity is difficult to verify.",
          },
        ],
      },
      {
        heading: "Which questions should you ask before signing a brokerage agreement?",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "How will the asking price be recommended?", text: "Ask for the comparable boats and the reasoning, not just a number." },
              { title: "Where will the boat appear?", text: "Confirm the marketplaces, the photography plan and who pays for it." },
              { title: "How are enquiries qualified?", text: "You want to know who is screening buyers and how often you will hear from them." },
              { title: "Who coordinates documents and settlement?", text: "Confirm which party handles the paperwork and which costs need your approval first." },
              { title: "What ends the agreement?", text: "Check duration, exclusivity, cancellation notice and what happens with buyers introduced during the term." },
            ],
          },
          {
            type: "quote",
            text: "The strongest answer is not the longest. Look for a defined process, transparent incentives and terms you can explain back in one minute.",
          },
        ],
      },
    ],
    faqs: [
      {
        question: "What is a typical yacht broker commission?",
        answer:
          "In most European and North American markets, traditional brokers charge roughly 8 to 10 percent of the sale price, sometimes with a minimum fee for smaller boats. Rates are negotiable and vary by vessel size, market and the level of service.",
      },
      {
        question: "Who pays the yacht broker, the buyer or the seller?",
        answer:
          "The seller pays the commission out of the sale proceeds. If a buyer's broker is involved, the two brokers usually split that commission rather than charging the buyer separately.",
      },
      {
        question: "Are there costs on top of the commission when selling a boat?",
        answer:
          "Yes. Typical extras include survey and haul-out costs if a sale falls through, marina fees while listed, legal or escrow fees, tax advice and any repairs the buyer negotiates after survey.",
      },
      {
        question: "What is BoatUneet's fee for selling a boat?",
        answer:
          "BoatUneet charges a 2.5 percent success fee on completion of a managed sale, with a free market-informed valuation up front. Third-party costs such as survey or legal fees are separate and agreed with you in advance.",
      },
    ],
  },
  {
    slug: "how-long-does-it-take-to-sell-a-boat",
    title: "How long does it take to sell a boat?",
    description:
      "See what influences time on market and how pricing, preparation and weekly decisions can keep a boat sale moving.",
    category: "Selling strategy",
    publishedAt: "2026-08-12",
    image: "/cards/card-1.png",
    imageAlt: "Performance yacht moving quickly across blue water",
    keywords: ["how long does it take to sell a boat", "boat time on market", "sell a boat fast", "boat sale timeline", "boat listing not selling"],
    quickAnswer:
      "Most well-priced, well-presented boats sell within about three to six months, but the range is wide: popular production models in a strong local market can sell in weeks, while specialised or overpriced boats can sit for a year or more. Pricing against credible comparables, good preparation and a weekly review rhythm are what shorten the timeline.",
    quickTake: [
      "There is no universal time on market. Demand, price, condition and season combine.",
      "Pricing against real comparables is the single biggest lever.",
      "Review evidence weekly: views, enquiries, viewings, offers.",
      "A stale listing costs money. Decide, adjust, repeat.",
      "Prepare the closing path before the buyer reaches it.",
    ],
    sections: [
      {
        heading: "Is there a typical time on market for a boat?",
        blocks: [
          {
            type: "p",
            text: "A popular production model in a strong local market may find a buyer quickly. A highly specialised yacht, an off-season listing or a boat that is difficult to inspect may take much longer. Timing is the result of demand, price, condition and buyer readiness working together.",
          },
          {
            type: "p",
            text: "A target plan can create urgency and useful review points, but it cannot guarantee a sale. Treat the timeline as a management tool rather than a promise.",
          },
        ],
      },
      {
        heading: "Which factors affect how fast a boat sells?",
        blocks: [
          {
            type: "p",
            text: "Some constraints are fixed, such as the boat's model and location. Others can be improved before or during the campaign.",
          },
          {
            type: "table",
            caption: "Sale-speed factors and whether you can change them",
            head: ["Factor", "Can you change it?", "What to do"],
            rows: [
              ["Price relative to comparables", "Yes", "Price inside the credible range from day one"],
              ["Photos, listing detail, documents", "Yes", "Professional photos, full spec, document index ready"],
              ["Mechanical and cosmetic condition", "Partly", "Fix cheap, visible issues; disclose the rest"],
              ["Response speed to enquiries", "Yes", "Reply the same day, offer viewing slots"],
              ["Season and location", "Partly", "List before the season; make viewing easy"],
              ["Model, size, rarity", "No", "Allow more time and a wider buyer search"],
            ],
          },
        ],
      },
      {
        heading: "How do milestones keep a boat sale moving?",
        blocks: [
          {
            type: "p",
            text: "A managed campaign should produce evidence: listing views, qualified enquiries, viewings, feedback and offers. Review that evidence weekly. If attention is low, improve presentation or distribution. If attention is high but viewings are absent, revisit the price or the quality of enquiries.",
          },
          {
            type: "steps",
            items: [
              { title: "Weeks 1–2: launch", text: "Photos, listing and document pack live. Expect the highest attention here, so price correctly from the start." },
              { title: "Weeks 3–6: read the signals", text: "Views without enquiries point to price or photos. Enquiries without viewings point to price or access." },
              { title: "Weeks 7–12: decide", text: "Adjust one variable at a time and give it two weeks. Do not let a listing drift." },
              { title: "Offer to completion: 4–8 weeks", text: "Survey, sea trial, contract and settlement take time even when everyone is keen." },
            ],
          },
        ],
      },
      {
        heading: "Why should you prepare the closing path early?",
        blocks: [
          {
            type: "p",
            text: "A sale is not complete when an offer is accepted. Inspection, survey, contract, settlement and handover still need coordination. Prepare the document pack and identify the relevant professional support before the buyer reaches that stage.",
          },
          {
            type: "note",
            title: "The practical goal",
            text: "Not simply the shortest timeline, but removing avoidable friction while protecting the quality and confidence of the transaction.",
          },
        ],
      },
    ],
    faqs: [
      {
        question: "What is the fastest way to sell a boat?",
        answer:
          "Price it inside the range of comparable boats, present it with professional photos and a complete document pack, respond to enquiries the same day and make viewings easy. Boats that do all four usually sell far faster than the market average.",
      },
      {
        question: "Why is my boat not selling?",
        answer:
          "The most common reasons are price above comparable listings, weak photos or listing detail, difficult viewing access and slow responses. Look at which signal is missing: views, enquiries, viewings or offers, and fix the stage where interest stops.",
      },
      {
        question: "When is the best time of year to sell a boat?",
        answer:
          "In most markets late winter to early summer, when buyers are planning the season. Listing a few weeks before the season starts gives you the largest pool of active buyers.",
      },
      {
        question: "How long does it take from accepted offer to completion?",
        answer:
          "Typically four to eight weeks. Survey, sea trial, any negotiation after survey, contract and payment all take time, and delays usually come from missing documents rather than from the buyer.",
      },
    ],
  },
];

export const categories = [...new Set(blogPosts.map((post) => post.category))];

export const getBlogPost = (slug: string) => blogPosts.find((post) => post.slug === slug);

export const relatedPosts = (post: BlogPost, count = 2) =>
  blogPosts.filter((candidate) => candidate.slug !== post.slug).slice(0, count);

/** Flattens every block to text so word count and reading time stay honest. */
function blockText(block: Block): string {
  switch (block.type) {
    case "p":
    case "quote":
      return block.text;
    case "note":
      return `${block.title} ${block.text}`;
    case "list":
      return block.items.join(" ");
    case "steps":
      return block.items.map((s) => `${s.title} ${s.text}`).join(" ");
    case "table":
      return [block.caption, ...block.head, ...block.rows.flat()].join(" ");
  }
}

export function postWordCount(post: BlogPost) {
  const text = [
    post.quickAnswer,
    ...post.quickTake,
    ...post.sections.flatMap((s) => [s.heading, ...s.blocks.map(blockText)]),
    ...post.faqs.flatMap((f) => [f.question, f.answer]),
  ].join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}

export const readingTime = (post: BlogPost) => Math.max(1, Math.round(postWordCount(post) / 220));

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** URL-safe id for section anchors and the table of contents. */
export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
