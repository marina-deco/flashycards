import { db } from "@/db";
import { cards } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getCardsByDeckId(deckId: number) {
  return await db
    .select()
    .from(cards)
    .where(eq(cards.deckId, deckId))
    .orderBy(desc(cards.updatedAt));
}

export async function createCard(data: { deckId: number; front: string; back: string }) {
  const [newCard] = await db.insert(cards).values(data).returning();
  return newCard;
}

export async function updateCard(cardId: number, data: { front?: string; back?: string }) {
  const [updated] = await db
    .update(cards)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(cards.id, cardId))
    .returning();
  
  return updated;
}

export async function deleteCard(cardId: number) {
  await db.delete(cards).where(eq(cards.id, cardId));
}
