import { db } from "@/db";
import { decks, cards, studySessions } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";

export async function getUserDecks(userId: string) {
  return await db.select().from(decks).where(eq(decks.userId, userId));
}

export async function getUserDecksWithStats(userId: string) {
  const userDecks = await db
    .select()
    .from(decks)
    .where(eq(decks.userId, userId))
    .orderBy(desc(decks.updatedAt));

  const decksWithStats = await Promise.all(
    userDecks.map(async (deck) => {
      // Get card count
      const [cardCountResult] = await db
        .select({ count: count() })
        .from(cards)
        .where(eq(cards.deckId, deck.id));

      // Get latest completed session
      const [latestSession] = await db
        .select()
        .from(studySessions)
        .where(
          and(
            eq(studySessions.deckId, deck.id),
            eq(studySessions.userId, userId),
          )
        )
        .orderBy(desc(studySessions.startedAt))
        .limit(1);

      const total = latestSession
        ? latestSession.correctCount + latestSession.incorrectCount
        : 0;
      const lastAccuracy =
        total > 0
          ? Math.round((latestSession.correctCount / total) * 100)
          : null;

      return {
        ...deck,
        cardCount: cardCountResult?.count ?? 0,
        lastStudied: latestSession?.completedAt ?? latestSession?.startedAt ?? null,
        lastAccuracy,
      };
    })
  );

  return decksWithStats;
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
