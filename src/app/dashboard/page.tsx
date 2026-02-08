import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserDecksWithStats } from "@/db/queries/deck-queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Play } from "lucide-react";
import { CreateDeckDialog } from "./components/CreateDeckDialog";
import { PlanLearningDialog } from "./components/PlanLearningDialog";

export default async function DashboardPage() {
  const { userId, has } = await auth();

  if (!userId) {
    redirect("/");
  }

  // Fetch user's decks with stats
  const userDecks = await getUserDecksWithStats(userId);

  // Check features
  const hasUnlimitedDecks = has({ feature: "unlimited_decks" });
  const hasAIFeature = has({ feature: "ai_flashcard_generation" });
  const isAtDeckLimit = !hasUnlimitedDecks && userDecks.length >= 3;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your flashcard decks and study progress
            </p>
          </div>
          {!hasUnlimitedDecks && (
            <div className="text-sm text-muted-foreground">
              {userDecks.length}/3 decks
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {!hasUnlimitedDecks && userDecks.length > 0 && (
            <Card className="p-4 bg-zinc-900/50 border-zinc-800 max-w-4xl">
              <CardContent className="p-0">
                <div className="flex items-start gap-2">
                  <span className="text-sm">👑</span>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-300">
                      {isAtDeckLimit ? (
                        <>
                          You&apos;ve reached the limit of 3 decks on the free
                          plan.{" "}
                          <Link
                            href="/pricing"
                            className="text-zinc-100 hover:underline font-medium"
                          >
                            Upgrade to Pro
                          </Link>{" "}
                          to create unlimited decks.
                        </>
                      ) : (
                        <>
                          You&apos;re using {userDecks.length} of 3 free decks.{" "}
                          <Link
                            href="/pricing"
                            className="text-zinc-100 hover:underline font-medium"
                          >
                            Upgrade to Pro
                          </Link>{" "}
                          for unlimited decks and AI flashcard generation.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {userDecks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mb-4">
              {userDecks.map((deck) => (
                <Link key={deck.id} href={`/decks/${deck.id}`} className="block">
                  <Card className="flex flex-col bg-zinc-900/50 w-full cursor-pointer transition-all hover:bg-zinc-800/50 hover:shadow-lg h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base leading-tight mb-1">
                        {deck.name}
                      </CardTitle>
                      <CardDescription className="text-xs leading-relaxed">
                        {deck.description || "No description"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pt-2 pb-4 space-y-3">
                      {/* Card count + last studied */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{deck.cardCount} cards</span>
                        <span>
                          {deck.lastStudied
                            ? `Studied ${new Date(deck.lastStudied).toLocaleDateString()}`
                            : "Not studied yet"}
                        </span>
                      </div>

                      {/* Progress bar */}
                      {deck.lastAccuracy !== null && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Last accuracy
                            </span>
                            <span className="font-medium">
                              {deck.lastAccuracy}%
                            </span>
                          </div>
                          <Progress
                            value={deck.lastAccuracy}
                            className="h-1.5"
                          />
                        </div>
                      )}

                      {/* Resume study button */}
                      {deck.cardCount > 0 && (
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="w-full mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link href={`/decks/${deck.id}/study`}>
                            <Play className="h-3 w-3 mr-1" />
                            {deck.lastStudied ? "Resume Study" : "Start Study"}
                          </Link>
                        </Button>
                      )}

                      {/* Plan Learning (AI, Pro only) */}
                      {hasAIFeature && (
                        <PlanLearningDialog
                          deckName={deck.name}
                          deckDescription={deck.description}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No decks yet. Create your first deck to get started!
            </p>
          )}

          <div className="flex justify-center mt-2">
            {isAtDeckLimit ? (
              <Link href="/pricing">
                <p className="text-sm text-muted-foreground hover:text-zinc-300 cursor-pointer transition-colors">
                  Upgrade to create more decks
                </p>
              </Link>
            ) : (
              <CreateDeckDialog isDisabled={false} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
