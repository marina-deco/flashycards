"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createDeck, getUserDecks } from "@/db/queries/deck-queries"

const createDeckSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
})

type CreateDeckInput = z.infer<typeof createDeckSchema>

export async function createDeckAction(input: CreateDeckInput) {
  // 1. Validate input
  const validatedData = createDeckSchema.parse(input)
  
  // 2. Check authentication
  const { userId, has } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }
  
  // 3. Check deck limit for free users
  const hasUnlimitedDecks = has({ feature: 'unlimited_decks' })
  
  if (!hasUnlimitedDecks) {
    const userDecks = await getUserDecks(userId)
    
    if (userDecks.length >= 3) {
      throw new Error("Free users are limited to 3 decks. Upgrade to Pro for unlimited decks.")
    }
  }
  
  // 4. Call query helper to perform database operation
  const newDeck = await createDeck({
    userId,
    ...validatedData,
  })
  
  // 5. Revalidate cache
  revalidatePath("/dashboard")
  
  return newDeck
}
