import { db } from "@/db";
import { decks } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getUserDecks(userId: string) {
  return await db.select().from(decks).where(eq(decks.userId, userId));
}

export async function getDeckById(deckId: number, userId: string) {
  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)));
  
  return deck;
}

export async function createDeck(data: { userId: string; name: string; description?: string }) {
  const [newDeck] = await db.insert(decks).values(data).returning();
  return newDeck;
}

export async function updateDeck(deckId: number, userId: string, data: { name?: string; description?: string }) {
  const [updated] = await db
    .update(decks)
    .set(data)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .returning();
  
  return updated;
}

export async function deleteDeck(deckId: number, userId: string) {
  await db.delete(decks).where(and(eq(decks.id, deckId), eq(decks.userId, userId)));
}
