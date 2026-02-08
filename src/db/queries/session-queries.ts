import { db } from "@/db";
import { studySessions, cardResults } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function createSession(data: {
  userId: string;
  deckId: number;
  totalCards: number;
}) {
  const [session] = await db
    .insert(studySessions)
    .values(data)
    .returning();
  return session;
}

export async function completeSession(
  sessionId: number,
  userId: string,
  data: { correctCount: number; incorrectCount: number }
) {
  const [updated] = await db
    .update(studySessions)
    .set({
      ...data,
      completedAt: new Date(),
    })
    .where(
      and(
        eq(studySessions.id, sessionId),
        eq(studySessions.userId, userId)
      )
    )
    .returning();
  return updated;
}

export async function recordCardResult(data: {
  sessionId: number;
  cardId: number;
  isCorrect: boolean;
  timeSpentMs?: number;
}) {
  const [result] = await db
    .insert(cardResults)
    .values(data)
    .returning();
  return result;
}

export async function getSessionsByDeckId(
  deckId: number,
  userId: string,
  limit: number = 5
) {
  return await db
    .select()
    .from(studySessions)
    .where(
      and(
        eq(studySessions.deckId, deckId),
        eq(studySessions.userId, userId)
      )
    )
    .orderBy(desc(studySessions.startedAt))
    .limit(limit);
}

export async function getLatestSession(deckId: number, userId: string) {
  const [session] = await db
    .select()
    .from(studySessions)
    .where(
      and(
        eq(studySessions.deckId, deckId),
        eq(studySessions.userId, userId),
      )
    )
    .orderBy(desc(studySessions.startedAt))
    .limit(1);
  return session ?? null;
}

export async function getWeakCardIds(deckId: number, userId: string) {
  // Get card IDs that were marked incorrect in the latest completed session
  const latestSession = await getLatestSession(deckId, userId);
  if (!latestSession) return [];

  const results = await db
    .select({ cardId: cardResults.cardId })
    .from(cardResults)
    .where(
      and(
        eq(cardResults.sessionId, latestSession.id),
        eq(cardResults.isCorrect, false)
      )
    );

  return results.map((r) => r.cardId);
}

export async function getDeckStudyStats(deckId: number, userId: string) {
  const sessions = await db
    .select()
    .from(studySessions)
    .where(
      and(
        eq(studySessions.deckId, deckId),
        eq(studySessions.userId, userId),
      )
    )
    .orderBy(desc(studySessions.startedAt))
    .limit(1);

  const latestSession = sessions[0] ?? null;

  return {
    lastStudied: latestSession?.completedAt ?? latestSession?.startedAt ?? null,
    lastAccuracy:
      latestSession && latestSession.correctCount + latestSession.incorrectCount > 0
        ? Math.round(
            (latestSession.correctCount /
              (latestSession.correctCount + latestSession.incorrectCount)) *
              100
          )
        : null,
  };
}
