import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getDeckById } from "@/db/queries/deck-queries";
import { getCardsByDeckId } from "@/db/queries/card-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import { AddCardDialog } from "./components/AddCardDialog";
import { EditDeckDialog } from "./components/EditDeckDialog";
import { DeleteDeckDialog } from "./components/DeleteDeckDialog";
import { EditCardDialog } from "./components/EditCardDialog";
import { DeleteCardDialog } from "./components/DeleteCardDialog";
import { GenerateCardsDialog } from "./components/GenerateCardsDialog";

export default async function DeckPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { userId, has } = await auth();

  if (!userId) {
    redirect("/");
  }

  // Check if user has AI feature
  const hasAIFeature = has({ feature: 'ai_flashcard_generation' });

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6 max-w-[1200px] mx-auto">
        {/* Back to Dashboard */}
        <Button asChild variant="ghost" className="w-fit">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Main Deck Info Card */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6">
              {/* Header with title and buttons */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{deck.name}</h1>
                  <p className="text-muted-foreground">
                    {deck.description || "Learn essential Spanish vocabulary with English translations"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <EditDeckDialog 
                    deckId={deckId}
                    currentName={deck.name}
                    currentDescription={deck.description}
                  />
                  <DeleteDeckDialog 
                    deckId={deckId}
                    deckName={deck.name}
                  />
                </div>
              </div>

              {/* Metadata */}
              <div className="flex gap-6 text-sm">
                <span className="text-muted-foreground">
                  {cards.length} cards
                </span>
                <span className="text-muted-foreground">
                  Created {new Date(deck.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Action Buttons */}
              <div>
                <Button 
                  asChild 
                  size="lg" 
                  className="w-full bg-white hover:bg-zinc-100 text-zinc-900"
                  disabled={cards.length === 0}
                >
                  <Link href={`/decks/${deckId}/study`}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Study Session
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Cards</h2>
            <div className="flex gap-2">
              <GenerateCardsDialog
                deckId={deckId}
                deckName={deck.name}
                deckDescription={deck.description}
                hasAIFeature={hasAIFeature}
                variant="outline"
              />
              <AddCardDialog deckId={deckId} />
            </div>
          </div>

          {cards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((card) => (
                <Card key={card.id} className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Front</div>
                        <div className="bg-zinc-800/50 rounded-md p-3 min-h-[60px]">
                          {card.front}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Back</div>
                        <div className="bg-zinc-800/50 rounded-md p-3 min-h-[60px]">
                          {card.back}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full">
                      <div className="flex-1">
                        <EditCardDialog
                          cardId={card.id}
                          deckId={deckId}
                          currentFront={card.front}
                          currentBack={card.back}
                        />
                      </div>
                      <div className="flex-1">
                        <DeleteCardDialog
                          cardId={card.id}
                          deckId={deckId}
                          cardFront={card.front}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center mb-4">
                  No cards yet. Add your first card to start studying!
                </p>
                <div className="flex gap-2">
                  <GenerateCardsDialog
                    deckId={deckId}
                    deckName={deck.name}
                    deckDescription={deck.description}
                    hasAIFeature={hasAIFeature}
                  />
                  <AddCardDialog deckId={deckId} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
