import type { Application, Source } from "./types";

// Original fictional exercise informed by the public instructions linked below.
// It is not an institutional application, funding offer, or partnership.
export const challengeReferences = [
  {
    label: "University of Minnesota student emergency funding instructions",
    url: "https://onestop.umn.edu/finances/types-financial-aid/student-emergency-funds",
  },
  {
    label: "University of Florida Aid-a-Gator overview",
    url: "https://www.sfa.ufl.edu/aidagator/",
  },
];

export const challengeApplication: Application = {
  id: "challenge-support",
  title: "The missing-details challenge",
  description:
    "An original fictional exercise inspired by public student-support instructions. No university affiliation or real funding offer.",
  fields: [
    {
      id: "name",
      label: "Full name",
      plainLanguage: "What name should this application use?",
      kind: "short",
      required: true,
    },
    {
      id: "email",
      label: "Email address",
      plainLanguage: "Where should the team contact you?",
      kind: "email",
      required: true,
    },
    {
      id: "program",
      label: "Degree program and year",
      plainLanguage: "What are you studying, and what year are you in?",
      kind: "short",
      required: true,
    },
    {
      id: "story",
      label:
        "Describe the unexpected expense and how it affects your coursework. Include the amount you are requesting and any other financial help you have already tried.",
      plainLanguage:
        "What happened, how is it affecting class, how much are you requesting, and what other financial help have you tried?",
      kind: "long",
      required: true,
      maxLength: 1800,
    },
  ],
};

export const challengeSources: Source[] = [
  {
    id: "my-notes",
    name: "Maya’s rough notes",
    text: "Full name: Maya Chen\nEmail address: maya.chen@example.edu\nDegree program and year: Second-year environmental engineering\nMy laptop stopped working on Monday.\nI need CAD software for weekly design assignments.\nThe library lab closes before I finish my evening shift at the campus cafe.\nI am behind on a design assignment.\nI have not confirmed a replacement price yet.\nI have not written down whether I tried other financial help.",
  },
];

export const challengeIllustration = {
  answers: [
    {
      fieldId: "name",
      value: "Maya Chen",
      evidence: [{ sourceId: "my-notes", quote: "Full name: Maya Chen" }],
    },
    {
      fieldId: "email",
      value: "maya.chen@example.edu",
      evidence: [
        { sourceId: "my-notes", quote: "Email address: maya.chen@example.edu" },
      ],
    },
    {
      fieldId: "program",
      value: "Second-year environmental engineering",
      evidence: [
        {
          sourceId: "my-notes",
          quote:
            "Degree program and year: Second-year environmental engineering",
        },
      ],
    },
    {
      fieldId: "story",
      value:
        "My laptop stopped working on Monday. I need CAD software for weekly design assignments. The library lab closes before I finish my evening shift at the campus cafe. I am behind on a design assignment.",
      evidence: [
        { sourceId: "my-notes", quote: "My laptop stopped working on Monday." },
        {
          sourceId: "my-notes",
          quote: "I need CAD software for weekly design assignments.",
        },
        {
          sourceId: "my-notes",
          quote:
            "The library lab closes before I finish my evening shift at the campus cafe.",
        },
        { sourceId: "my-notes", quote: "I am behind on a design assignment." },
      ],
    },
  ],
};

export const challengeCoverage = [
  {
    fieldId: "story",
    parts: [
      {
        id: "event",
        label: "The unexpected expense",
        promptQuote: "the unexpected expense",
        question: "What unexpected expense are you dealing with?",
        value: "My laptop stopped working on Monday.",
        evidence: [
          {
            sourceId: "my-notes",
            quote: "My laptop stopped working on Monday.",
          },
        ],
      },
      {
        id: "impact",
        label: "The effect on coursework",
        promptQuote: "how it affects your coursework",
        question: "How is this affecting your coursework?",
        value:
          "I need CAD software for weekly design assignments. The library lab closes before I finish my evening shift at the campus cafe. I am behind on a design assignment.",
        evidence: [
          {
            sourceId: "my-notes",
            quote: "I need CAD software for weekly design assignments.",
          },
          {
            sourceId: "my-notes",
            quote:
              "The library lab closes before I finish my evening shift at the campus cafe.",
          },
          {
            sourceId: "my-notes",
            quote: "I am behind on a design assignment.",
          },
        ],
      },
      {
        id: "amount",
        label: "The amount you are requesting",
        promptQuote: "the amount you are requesting",
        question: "What amount have you confirmed you want to request?",
        value: "",
        evidence: [],
      },
      {
        id: "other-help",
        label: "Other financial help tried",
        promptQuote: "any other financial help you have already tried",
        question:
          "What other financial help have you already tried? “None yet” is a valid detail if it is true.",
        value: "",
        evidence: [],
      },
    ],
  },
];
