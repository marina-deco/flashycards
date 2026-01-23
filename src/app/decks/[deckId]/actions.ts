"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { createCard, updateCard, deleteCard } from "@/db/queries/card-queries"
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
  
  // 3. Verify deck ownership
  const deck = await getDeckById(validatedData.deckId, userId)
  if (!deck) {
    throw new Error("Deck not found or unauthorized")
  }
  
  // 4. Create card
  const newCard = await createCard(validatedData)
  
  // 5. Revalidate cache
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
  
  // 3. Verify deck ownership
  const deck = await getDeckById(validatedData.deckId, userId)
  if (!deck) {
    throw new Error("Deck not found or unauthorized")
  }
  
  // 4. Update card
  const updatedCard = await updateCard(validatedData.cardId, {
    front: validatedData.front,
    back: validatedData.back,
  })
  
  // 5. Revalidate cache
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
  
  // 3. Verify deck ownership
  const deck = await getDeckById(validatedData.deckId, userId)
  if (!deck) {
    throw new Error("Deck not found or unauthorized")
  }
  
  // 4. Delete card
  await deleteCard(validatedData.cardId)
  
  // 5. Revalidate cache
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
