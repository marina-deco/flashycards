import { db } from "@/db";
import { cards, decks } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function getCardsByDeckId(deckId: number, userId: string) {
  // First verify deck ownership
  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)));

  if (!deck) {
    throw new Error("Deck not found or unauthorized");
  }

  return await db
    .select()
    .from(cards)
    .where(eq(cards.deckId, deckId))
    .orderBy(desc(cards.updatedAt));
}

export async function createCard(data: { deckId: number; front: string; back: string }, userId: string) {
  // First verify deck ownership
  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, data.deckId), eq(decks.userId, userId)));

  if (!deck) {
    throw new Error("Deck not found or unauthorized");
  }

  const [newCard] = await db.insert(cards).values(data).returning();
  return newCard;
}

export async function updateCard(cardId: number, deckId: number, userId: string, data: { front?: string; back?: string }) {
  // First verify deck ownership
  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)));

  if (!deck) {
    throw new Error("Deck not found or unauthorized");
  }

  const [updated] = await db
    .update(cards)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(cards.id, cardId))
    .returning();
  
  return updated;
}

export async function deleteCard(cardId: number, deckId: number, userId: string) {
  // First verify deck ownership
  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)));

  if (!deck) {
    throw new Error("Deck not found or unauthorized");
  }

  await db.delete(cards).where(eq(cards.id, cardId));
}

export async function createCards(data: { deckId: number; front: string; back: string }[], userId: string) {
  // Verify all cards belong to decks owned by the user
  // Since all cards are for the same deck, check the first deckId
  if (data.length === 0) {
    return [];
  }

  const deckId = data[0].deckId;
  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)));

  if (!deck) {
    throw new Error("Deck not found or unauthorized");
  }

  const newCards = await db.insert(cards).values(data).returning();
  return newCards;
}
