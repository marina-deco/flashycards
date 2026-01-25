"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { createCard, updateCard, deleteCard, createCards } from "@/db/queries/card-queries"
import { getDeckById, updateDeck, deleteDeck } from "@/db/queries/deck-queries"

const createCardSchema = z.object({
  deckId: z.number(),
  front: z.string().min(1, "Front is required"),
  back: z.string().min(1, "Back is required"),
})

type CreateCardInput = z.infer<typeof createCardSchema>

export async function createCardAction(input: CreateCardInput) {
  // 1. Validate input
  const validatedData = createCardSchema.parse(input)
  
  // 2. Check authentication
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }
  
  // 3. Create card (ownership verification now in query helper)
  const newCard = await createCard(validatedData, userId)
  
  // 4. Revalidate cache
  revalidatePath(`/decks/${validatedData.deckId}`)
  
  return newCard
}

const updateCardSchema = z.object({
  cardId: z.number(),
  deckId: z.number(),
  front: z.string().min(1, "Front is required"),
  back: z.string().min(1, "Back is required"),
})

type UpdateCardInput = z.infer<typeof updateCardSchema>

export async function updateCardAction(input: UpdateCardInput) {
  // 1. Validate input
  const validatedData = updateCardSchema.parse(input)
  
  // 2. Check authentication
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }
  
  // 3. Update card (ownership verification now in query helper)
  const updatedCard = await updateCard(
    validatedData.cardId, 
    validatedData.deckId,
    userId,
    {
      front: validatedData.front,
      back: validatedData.back,
    }
  )
  
  // 4. Revalidate cache
  revalidatePath(`/decks/${validatedData.deckId}`)
  
  return updatedCard
}

const updateDeckSchema = z.object({
  deckId: z.number(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
})

type UpdateDeckInput = z.infer<typeof updateDeckSchema>

export async function updateDeckAction(input: UpdateDeckInput) {
  // 1. Validate input
  const validatedData = updateDeckSchema.parse(input)
  
  // 2. Check authentication
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }
  
  // 3. Update deck (ownership is verified in the query)
  const updatedDeck = await updateDeck(validatedData.deckId, userId, {
    name: validatedData.name,
    description: validatedData.description,
  })
  
  if (!updatedDeck) {
    throw new Error("Deck not found or unauthorized")
  }
  
  // 4. Revalidate cache
  revalidatePath(`/decks/${validatedData.deckId}`)
  revalidatePath("/dashboard")
  
  return updatedDeck
}

const deleteCardSchema = z.object({
  cardId: z.number(),
  deckId: z.number(),
})

type DeleteCardInput = z.infer<typeof deleteCardSchema>

export async function deleteCardAction(input: DeleteCardInput) {
  // 1. Validate input
  const validatedData = deleteCardSchema.parse(input)
  
  // 2. Check authentication
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }
  
  // 3. Delete card (ownership verification now in query helper)
  await deleteCard(validatedData.cardId, validatedData.deckId, userId)
  
  // 4. Revalidate cache
  revalidatePath(`/decks/${validatedData.deckId}`)
}

const deleteDeckSchema = z.object({
  deckId: z.number(),
})

type DeleteDeckInput = z.infer<typeof deleteDeckSchema>

export async function deleteDeckAction(input: DeleteDeckInput) {
  // 1. Validate input
  const validatedData = deleteDeckSchema.parse(input)
  
  // 2. Check authentication
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }
  
  // 3. Verify deck ownership
  const deck = await getDeckById(validatedData.deckId, userId)
  if (!deck) {
    throw new Error("Deck not found or unauthorized")
  }
  
  // 4. Delete deck (cascades to all cards)
  await deleteDeck(validatedData.deckId, userId)
  
  // 5. Revalidate cache
  revalidatePath("/dashboard")
  
  // 6. Redirect to dashboard
  redirect("/dashboard")
}

const generateCardsSchema = z.object({
  deckId: z.number(),
  deckName: z.string(),
  deckDescription: z.string().min(1, "Description is required for AI generation"),
})

type GenerateCardsInput = z.infer<typeof generateCardsSchema>

const flashcardSchema = z.object({
  cards: z.array(
    z.object({
      front: z.string().describe("The question or prompt on the front of the card"),
      back: z.string().describe("The answer or explanation on the back of the card"),
    })
  ),
})

export async function generateCardsWithAIAction(input: GenerateCardsInput) {
  // 1. Validate input
  const validatedData = generateCardsSchema.parse(input)

  // 2. Check authentication
  const { userId, has } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }

  // 3. Check for AI feature access
  const hasAIFeature = has({ feature: 'ai_flashcard_generation' })
  if (!hasAIFeature) {
    throw new Error("AI flashcard generation requires a Pro plan")
  }

  // 4. Generate flashcards with AI
  const { object } = await generateObject({
    model: google("gemini-flash-latest"),
    schema: flashcardSchema,
    prompt: `Generate 20 educational flashcards about "${validatedData.deckName}".
${validatedData.deckDescription ? `Context: ${validatedData.deckDescription}` : ""}
Make them clear, concise, and suitable for learning.
Cover key concepts and important details.
Each card should have a question/prompt on the front and an answer/explanation on the back.`,
  })

  // 5. Insert cards into database (ownership verification now in query helper)
  const cardsToInsert = object.cards.map((card) => ({
    deckId: validatedData.deckId,
    front: card.front,
    back: card.back,
  }))

  const newCards = await createCards(cardsToInsert, userId)

  // 6. Revalidate cache
  revalidatePath(`/decks/${validatedData.deckId}`)

  return newCards
}
