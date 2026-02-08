"use server"

import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import {
  createSession,
  completeSession,
  recordCardResult,
} from "@/db/queries/session-queries"

const startSessionSchema = z.object({
  deckId: z.number(),
  totalCards: z.number(),
})

type StartSessionInput = z.infer<typeof startSessionSchema>

export async function startSessionAction(input: StartSessionInput) {
  const validatedData = startSessionSchema.parse(input)

  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }

  const session = await createSession({
    userId,
    deckId: validatedData.deckId,
    totalCards: validatedData.totalCards,
  })

  return session
}

const recordCardResultSchema = z.object({
  sessionId: z.number(),
  cardId: z.number(),
  isCorrect: z.boolean(),
  timeSpentMs: z.number().optional(),
})

type RecordCardResultInput = z.infer<typeof recordCardResultSchema>

export async function recordCardResultAction(input: RecordCardResultInput) {
  const validatedData = recordCardResultSchema.parse(input)

  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }

  const result = await recordCardResult(validatedData)
  return result
}

const completeSessionSchema = z.object({
  sessionId: z.number(),
  correctCount: z.number(),
  incorrectCount: z.number(),
})

type CompleteSessionInput = z.infer<typeof completeSessionSchema>

export async function completeSessionAction(input: CompleteSessionInput) {
  const validatedData = completeSessionSchema.parse(input)

  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }

  const session = await completeSession(validatedData.sessionId, userId, {
    correctCount: validatedData.correctCount,
    incorrectCount: validatedData.incorrectCount,
  })

  return session
}
