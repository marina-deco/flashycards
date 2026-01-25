import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getDeckById } from "@/db/queries/deck-queries";
import { getCardsByDeckId } from "@/db/queries/card-queries";
import { StudyCard } from "./components/StudyCard";

export default async function StudyPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const { deckId: deckIdParam } = await params;
  const deckId = parseInt(deckIdParam);
  
  if (isNaN(deckId)) {
    notFound();
  }

  // Fetch deck and verify ownership
  const deck = await getDeckById(deckId, userId);

  if (!deck) {
    notFound();
  }

  // Fetch cards for this deck (ownership already verified in query)
  const cards = await getCardsByDeckId(deckId, userId);

  if (cards.length === 0) {
    redirect(`/decks/${deckId}`);
  }

  return (
    <StudyCard 
      deckId={deckId}
      deckName={deck.name}
      cards={cards}
    />
  );
}
