/**
 * Mock API response fixtures for testing.
 * These fixtures simulate LLM-generated garment instruction responses
 * and allow frontend/backend development without real API calls.
 */

import type { GarmentInstructions } from "../../lib/instructions/schema";
export type {
  AssemblyStep,
  GarmentInstructions,
} from "../../lib/instructions/schema";

export const mockCasualStays: GarmentInstructions = {
  garment: "18th-century stays",
  mode: "casual",
  materials: [
    "Sturdy cotton or linen fabric (2-3 yards)",
    "Linen or cotton twill for interlining",
    "Boning material (synthetic or reed)",
    "Matching thread",
    "Metal eyelets or grommets",
    "Lacing cord (cotton or synthetic)",
    "Bias tape for edges",
  ],
  assembly: [
    {
      step: 1,
      description: "Cut front and back panels",
      details: [
        "Use a simple rectangular pattern",
        "Front panels approximately 12 inches wide",
        "Back panels 6-8 inches wide with center back seam",
      ],
    },
    {
      step: 2,
      description: "Insert boning channels",
      details: [
        "Stitch vertical channels 1.5 inches apart",
        "Insert boning through channels",
        "Boning runs from bust to waist",
      ],
    },
    {
      step: 3,
      description: "Assemble side seams",
      details: ["Use a 1/2 inch seam allowance", "Stitch side panels to front", "Try on stays before finishing seams to ensure fit"],
    },
    {
      step: 4,
      description: "Add closure",
      details: [
        "Install eyelets or grommets for front closure, space 3/4 to 1 inch apart"
        ],
    },
  ],
  finishing: [
    "Bind neckline and armholes with bias tape",
    "Trim excess seam allowances",
    "Press finished stays lightly",
    "Lace up front closure",
  ],
  notes:
    "Casual mode simplifies some techniques for beginners. Modern synthetic boning is easier to work with than period-correct materials.",
  generatedAt: "2026-04-03T00:00:00.000Z",
};

export const mockProfessionalStays: GarmentInstructions = {
  garment: "18th-century stays",
  mode: "professional",
  materials: [
    "Linen twill or wool (period-appropriate, 18-22 oz)",
    "Linen or cotton foundation fabric (for interlining)",
    "Reed or baleen boning, or cotton cording for softer support",
    "Linen thread (hand-stitching quality)",
    "Linen twill for channels",
    "Buttonhole twist for eyelets",
    "Lacing cord (natural fiber)",
    "Front busk (optional, for added structure. Typically wood or bone)",
    "Silk or wool binding for finishing",
  ],
  assembly: [
    {
      step: 1,
      description: "Draft pattern from historical sources",
      details: [
        "Reference 1770-1790 extant examples",
        "Account for center front opening or back lacing",
        "Front busk panel (optional based on period)",
      ],
    },
    {
      step: 2,
      description: "Cut and prepare layers",
      details: [
        "Cut fashion fabric, linen foundation, and lining as separate layers",
        "Grain line runs vertically for stability",
        "Allow 1/2 inch seam allowances throughout",
        "Add in generous extra allowance for sections where cording will be used, to account for distortion",
      ],
    },
    {
      step: 3,
      description: "Create boning channels with hand-stitching",
      details: [
        "Use backstitch or running backstitch",
        "Channel spacing varies: 1-1.5 inches spacing typical",
        "Channel widths accommodate bone size (typically 3/8 to 1/2 inch)",
        "Boning runs full length for structure, cording sections typically run diagonally or horizontally for shaping and softer support",
      ],
    },
    {
      step: 4,
      description: "Assemble and bind edges",
      details: [
        "Hand-stitch side seams using backstitch",
        "Try on stays before finishing edges to ensure fit",
        "Bind edges with linen or wool twill",
      ],
    },
    {
      step: 5,
      description: "Finish closure",
      details: [
        "Hand-stitch eyelets with buttonhole twist, spaced 1/2 to 3/4 inch apart",
        "Spiral lace with natural fiber cord",
        "Ensure even closure without gaping",
      ],
    },
  ],
  finishing: [
    "Hand-stitch any remaining binding by fell seam if visible inside",
    "Check all stitching for consistency and strength",
    "Test closure mechanism for durability",
  ],
  notes:
    "Professional mode emphasizes historical accuracy and hand-sewing techniques. Reed boning and natural fabrics are period-appropriate and will age better than synthetics. Shaping garments will generally adapt to the wearer over time, as body heat and movement soften and reform the boning.",
  generatedAt: "2026-04-03T00:00:00.000Z",
};

export const mockSimpleDress: GarmentInstructions = {
  garment: "Simple linen shift dress",
  mode: "casual",
  materials: [
    "Linen fabric (3-4 yards)",
    "Coordinating thread",
    "Optional: lace or trim for edges",
  ],
  assembly: [
    {
      step: 1,
      description: "Cut pattern pieces",
      details: [
        "Front and back panels",
        "Sleeves (optional or minimal)",
        "Skirt godets",
      ],
    },
    {
      step: 2,
      description: "Sew shoulder and upper side seams",
      details: ["Side seams and shoulder seams with 1/2 inch allowance"],
    },
    {
      step: 3,
      description: "Attach godets to skirt panels",
      details: ["Godets are added at or below the hip to add fullness"],
    },
    {
      step: 4,
      description: "Finish neckline and armholes",
      details: ["Bind or fold and stitch simple hem"],
    },
  ],
  finishing: [
    "Try on and adjust fit if needed",
    "Hem skirt to desired length",
    "Add optional trim or lace to neckline and sleeves",
  ],
  generatedAt: "2026-04-03T00:00:00.000Z",
};

/**
 * Mock response factory.
 * Use this to generate fixture data with custom parameters.
 */
export function createMockInstructions(
  overrides: Partial<GarmentInstructions>
): GarmentInstructions {
  return {
    garment: "Test garment",
    mode: "casual",
    materials: ["Test material 1", "Test material 2"],
    assembly: [
      {
        step: 1,
        description: "Test step 1",
        details: ["Test detail 1"],
      },
    ],
    finishing: ["Test finishing step 1"],
    generatedAt: "2026-04-03T00:00:00.000Z",
    ...overrides,
  };
}
