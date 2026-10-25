import type { Application, Source } from "./types";

export const sampleApplication: Application = {
  id: "sample-support",
  title: "Student support fund",
  description:
    "A fictional application for a one-time campus support grant. Created for this demo; it is not a real funding opportunity.",
  fields: [
    {
      id: "name",
      label: "Full name",
      plainLanguage: "What name should the application use?",
      required: true,
      kind: "short",
    },
    {
      id: "email",
      label: "University email address",
      plainLanguage: "Where should the support team contact you?",
      required: true,
      kind: "email",
    },
    {
      id: "program",
      label: "Current degree program and year of study",
      plainLanguage: "What are you studying, and what year are you in?",
      required: true,
      kind: "short",
    },
    {
      id: "circumstances",
      label:
        "Describe the unforeseen circumstances necessitating financial assistance and the resulting impediment to academic participation.",
      plainLanguage:
        "What happened, and how is it making college harder right now?",
      required: true,
      kind: "long",
      maxLength: 900,
    },
    {
      id: "amount",
      label: "Amount requested",
      plainLanguage:
        "How much support are you asking for? Enter an amount in dollars.",
      required: true,
      kind: "number",
    },
    {
      id: "plan",
      label:
        "Explain how the requested disbursement will directly facilitate the continuation of your academic pursuits.",
      plainLanguage: "How would this support help you keep studying?",
      required: true,
      kind: "long",
      maxLength: 600,
    },
    {
      id: "other",
      label: "Additional information",
      plainLanguage:
        "Is there anything else you want the team to know? You can leave this blank.",
      required: false,
      kind: "long",
      maxLength: 500,
    },
  ],
};

export const sampleSources: Source[] = [
  {
    id: "my-notes",
    name: "My notes",
    text: "Full name: Maya Chen\nUniversity email address: maya.chen@example.edu\nCurrent degree program and year of study: Second-year environmental engineering student.\nMy laptop stopped working on Monday. I need it for CAD assignments and online coursework.\nI have been using library computers, but the lab closes before I finish my evening shift.\nI work at the campus cafe three evenings a week.\nA refurbished laptop would let me finish assignments at home after work.\nI have not checked the price of a replacement yet.",
  },
  {
    id: "course-note",
    name: "Course note",
    text: "Our design course uses CAD software for weekly assignments. Submissions are due online each Friday.",
  },
];

// Deliberately authored illustration, never passed off as live model inference.
export const sampleIllustration = {
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
        {
          sourceId: "my-notes",
          quote: "University email address: maya.chen@example.edu",
        },
      ],
    },
    {
      fieldId: "program",
      value: "Second-year environmental engineering student.",
      evidence: [
        {
          sourceId: "my-notes",
          quote:
            "Current degree program and year of study: Second-year environmental engineering student.",
        },
      ],
    },
    {
      fieldId: "circumstances",
      value:
        "My laptop stopped working on Monday. I need it for CAD assignments and online coursework. I have been using library computers, but the lab closes before I finish my evening shift.",
      evidence: [
        {
          sourceId: "my-notes",
          quote:
            "My laptop stopped working on Monday. I need it for CAD assignments and online coursework.",
        },
        {
          sourceId: "my-notes",
          quote:
            "I have been using library computers, but the lab closes before I finish my evening shift.",
        },
      ],
    },
    {
      fieldId: "plan",
      value:
        "A refurbished laptop would let me finish assignments at home after work.",
      evidence: [
        {
          sourceId: "my-notes",
          quote:
            "A refurbished laptop would let me finish assignments at home after work.",
        },
      ],
    },
  ],
};
