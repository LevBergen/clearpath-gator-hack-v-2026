export const narration = {
  model: "gemini-3.8-flash-tts",
  voice: "Orus",
  style:
    "Confident adult male founder explaining a working product to judges. Natural American English, direct and conversational. Medium brisk pace, clear consonants, engaged and assured. Avoid breathiness, vocal fry, melodrama, sing-song cadence, and advertisement voice.",
  segments: [
    [
      "It sounds finished. What did it leave out?",
      "This answer sounds finished. It is not. A student explains why she needs help replacing a broken laptop. But the application asks for four things, and her paragraph answers two. Clearpath helps her find the missing parts and finish the answer herself.",
    ],
    [
      "One question, four parts · fictional example",
      "Here is Maya’s application. She describes the expense and how it affects her coursework. What amount does she need? What other financial help has she tried? Neither detail is in her notes. The opening example is an illustration. Next, we will run the actual model.",
    ],
    [
      "Live Gemma 4 inference · full wait shown",
      "Gemma four receives the original question and Maya’s rough notes. We are keeping the full wait in this recording. The server checks that suggested question parts quote the prompt, and that suggested details cite exact excerpts from her notes. Those checks establish where the text came from. Maya still checks what it means.",
    ],
    [
      "Check the breakdown. Check the source.",
      "The model has proposed four parts. Maya compares them with the original question, then checks the two details supported by her notes. The excerpts are right beside each decision. If a suggestion misreads the question, she can remove it. If the wording is wrong, she can edit it.",
    ],
    [
      "Two precise follow-ups. Two answers from Maya.",
      "Now the app asks for the missing amount and the other help she has tried. In this fictional example, Maya enters four hundred fifty dollars and says she has not tried other help yet. That answer comes from Maya. It was never inferred from silence. Clearpath joins only the details she confirmed.",
    ],
    [
      "Review the full answer before download",
      "The draft now includes all four details. Maya reads the full answer, edits it if needed, and reviews the other fields. A changed answer requires a fresh review. Saving unfinished work is supported too, but restoring a file resets its confirmations. An old checkmark should never stand in for reading the current draft.",
    ],
    [
      "A reviewed draft, ready for the applicant’s next step",
      "Here is the downloaded packet: original questions, answers, and the parts Maya checked. It has not been submitted. Clearpath is a working text-form prototype, built with Gemma, TypeScript, and shared validation across the server and browser. It does not verify facts or eligibility. It helps an applicant see what the question asks, supply their own details, and leave with an answer they have reviewed.",
    ],
  ],
};
