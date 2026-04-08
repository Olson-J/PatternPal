import type { ProjectRecord } from "./schema";

export const fixtureProjects: ProjectRecord[] = [
  {
    id: "proj-stays-casual",
    userId: "fixture-user-1",
    title: "Weekend Stays Build",
    description: "18th-century stays with beginner-friendly steps",
    mode: "casual",
    instructions: {
      garment: "18th-century stays",
      mode: "casual",
      materials: ["Sturdy linen", "Synthetic boning", "Thread", "Lacing cord"],
      assembly: [
        { step: 1, description: "Cut and mark all panels" },
        { step: 2, description: "Stitch channels and insert boning" },
        { step: 3, description: "Assemble seams and install eyelets" },
      ],
      finishing: ["Bind top and bottom edges", "Press seams", "Test fit"],
      notes: "Fixture project for dashboard testing.",
      generatedAt: "2026-04-06T12:00:00.000Z",
    },
    createdAt: "2026-04-06T12:05:00.000Z",
    updatedAt: "2026-04-06T12:05:00.000Z",
  },
  {
    id: "proj-shift-professional",
    userId: "fixture-user-2",
    title: "Shift Dress Reference",
    description: "Professional construction notes for linen shift dress",
    mode: "professional",
    instructions: {
      garment: "Simple linen shift dress",
      mode: "professional",
      materials: ["Fine linen", "Linen thread", "Bias binding"],
      assembly: [
        { step: 1, description: "Draft based on extant references" },
        { step: 2, description: "Assemble body panels with consistent seam allowances" },
        { step: 3, description: "Finish neckline, sleeves, and hem" },
      ],
      finishing: ["Hand-fell visible seams", "Final fit and press"],
      notes: "Fixture project for detail view testing.",
      generatedAt: "2026-04-07T09:30:00.000Z",
    },
    createdAt: "2026-04-07T09:35:00.000Z",
    updatedAt: "2026-04-07T09:35:00.000Z",
  },
];
