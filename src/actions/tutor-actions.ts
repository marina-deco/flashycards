"use server"

import { auth } from "@clerk/nextjs/server"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"

// --- Micro Tutor: Hint ---

const hintInputSchema = z.object({
  cardFront: z.string(),
})

const hintOutputSchema = z.object({
  hint: z
    .string()
    .describe(
      "A subtle hint that guides reasoning without revealing the full answer. Max 30 words."
    ),
})

export async function getHintAction(input: z.infer<typeof hintInputSchema>) {
  const validatedData = hintInputSchema.parse(input)

  const { userId, has } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const hasAIFeature = has({ feature: "ai_flashcard_generation" })
  if (!hasAIFeature) throw new Error("AI features require a Pro plan")

  const { object } = await generateObject({
    model: google("gemini-flash-latest"),
    schema: hintOutputSchema,
    prompt: `Provide a subtle hint for this flashcard without revealing the full answer.
Focus on guiding reasoning, not giving the solution.
Max 30 words.

Flashcard front: ${validatedData.cardFront}`,
  })

  return object.hint
}

// --- Micro Tutor: Explain ---

const explainInputSchema = z.object({
  cardFront: z.string(),
  cardBack: z.string(),
})

const explainOutputSchema = z.object({
  explanation: z
    .string()
    .describe(
      "A simple explanation using analogy and one practical example. Max 80 words. No jargon."
    ),
})

export async function getExplanationAction(
  input: z.infer<typeof explainInputSchema>
) {
  const validatedData = explainInputSchema.parse(input)

  const { userId, has } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const hasAIFeature = has({ feature: "ai_flashcard_generation" })
  if (!hasAIFeature) throw new Error("AI features require a Pro plan")

  const { object } = await generateObject({
    model: google("gemini-flash-latest"),
    schema: explainOutputSchema,
    prompt: `You are a tutor explaining a single concept.
Flashcard front: ${validatedData.cardFront}
Flashcard back: ${validatedData.cardBack}

Provide a simple explanation using analogy and one practical example.
Keep it under 80 words. Avoid jargon.`,
  })

  return object.explanation
}

// --- Micro Tutor: Why Wrong ---

const whyWrongInputSchema = z.object({
  cardFront: z.string(),
  cardBack: z.string(),
})

const whyWrongOutputSchema = z.object({
  explanation: z
    .string()
    .describe(
      "Explain the common misconception, provide one correction tip and one memory aid. Concise."
    ),
})

export async function getWhyWrongAction(
  input: z.infer<typeof whyWrongInputSchema>
) {
  const validatedData = whyWrongInputSchema.parse(input)

  const { userId, has } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const hasAIFeature = has({ feature: "ai_flashcard_generation" })
  if (!hasAIFeature) throw new Error("AI features require a Pro plan")

  const { object } = await generateObject({
    model: google("gemini-flash-latest"),
    schema: whyWrongOutputSchema,
    prompt: `The learner marked this flashcard incorrect.
Card front: ${validatedData.cardFront}
Card back: ${validatedData.cardBack}

Explain the misconception that commonly occurs.
Provide one correction tip and one memory aid.
Keep concise.`,
  })

  return object.explanation
}

// --- Deep Tutor: Understand Topic ---

const understandTopicInputSchema = z.object({
  deckName: z.string(),
  deckDescription: z.string().optional(),
})

const understandTopicOutputSchema = z.object({
  summary: z
    .string()
    .describe("A 2-sentence summary of the topic."),
  keyConcepts: z
    .array(z.string())
    .describe("List of key concepts."),
  connections: z
    .string()
    .describe("How concepts connect in a mental map style explanation. Plain language."),
})

export async function getTopicOverviewAction(
  input: z.infer<typeof understandTopicInputSchema>
) {
  const validatedData = understandTopicInputSchema.parse(input)

  const { userId, has } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const hasAIFeature = has({ feature: "ai_flashcard_generation" })
  if (!hasAIFeature) throw new Error("AI features require a Pro plan")

  const { object } = await generateObject({
    model: google("gemini-flash-latest"),
    schema: understandTopicOutputSchema,
    prompt: `You are an expert tutor.
The learner is studying "${validatedData.deckName}".
${validatedData.deckDescription ? `Context: ${validatedData.deckDescription}` : ""}

Summarize the topic in 2 sentences.
List key concepts and relationships.
Show how concepts connect in a mental map style explanation.
Use plain language.
Do not exceed 150 words total.`,
  })

  return object
}

// --- Deep Tutor: Improve Weak Areas ---

const improveWeakAreasInputSchema = z.object({
  deckName: z.string(),
  accuracy: z.number(),
  incorrectCards: z.array(
    z.object({
      front: z.string(),
      back: z.string(),
    })
  ),
})

const improveWeakAreasOutputSchema = z.object({
  weakThemes: z
    .string()
    .describe("Identified weak themes from the incorrect cards."),
  actions: z
    .array(z.string())
    .describe("3 focused, actionable next steps to improve."),
})

export async function getImproveWeakAreasAction(
  input: z.infer<typeof improveWeakAreasInputSchema>
) {
  const validatedData = improveWeakAreasInputSchema.parse(input)

  const { userId, has } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const hasAIFeature = has({ feature: "ai_flashcard_generation" })
  if (!hasAIFeature) throw new Error("AI features require a Pro plan")

  const incorrectList = validatedData.incorrectCards
    .map((c) => `- Front: ${c.front} | Back: ${c.back}`)
    .join("\n")

  const { object } = await generateObject({
    model: google("gemini-flash-latest"),
    schema: improveWeakAreasOutputSchema,
    prompt: `You are an expert learning coach.
Session stats: ${validatedData.accuracy}% accuracy, Deck: "${validatedData.deckName}".

Incorrect cards:
${incorrectList}

Identify weak themes and suggest next 3 focused actions.
Keep advice actionable and short.`,
  })

  return object
}

// --- Deep Tutor: Plan My Learning ---

const planLearningInputSchema = z.object({
  deckName: z.string(),
  deckDescription: z.string().optional(),
})

const planLearningOutputSchema = z.object({
  clarification: z
    .string()
    .describe("Brief clarification of the topic scope."),
  subSkills: z
    .array(z.string())
    .describe("3-5 sub-skills to master for this topic."),
  suggestedApproach: z
    .string()
    .describe("A concise suggested learning approach."),
})

export async function getPlanLearningAction(
  input: z.infer<typeof planLearningInputSchema>
) {
  const validatedData = planLearningInputSchema.parse(input)

  const { userId, has } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const hasAIFeature = has({ feature: "ai_flashcard_generation" })
  if (!hasAIFeature) throw new Error("AI features require a Pro plan")

  const { object } = await generateObject({
    model: google("gemini-flash-latest"),
    schema: planLearningOutputSchema,
    prompt: `You are an expert tutor and curriculum planner.
The learner selected topic: "${validatedData.deckName}".
${validatedData.deckDescription ? `Description: ${validatedData.deckDescription}` : ""}

Clarify the topic briefly, list 3-5 sub-skills needed to master it, and suggest a concise learning approach.
Keep response concise, non-jargony, and productivity-focused.`,
  })

  return object
}
