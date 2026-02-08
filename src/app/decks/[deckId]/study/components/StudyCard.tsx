"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  RotateCcw,
  Shuffle,
  Check,
  X,
  Lightbulb,
  BookOpen,
  HelpCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import {
  startSessionAction,
  recordCardResultAction,
  completeSessionAction,
} from "@/actions/session-actions";
import {
  getHintAction,
  getExplanationAction,
  getWhyWrongAction,
  getImproveWeakAreasAction,
} from "@/actions/tutor-actions";
import { FloatingTutorButton } from "@/components/FloatingTutorButton";

type CardData = {
  id: number;
  front: string;
  back: string;
};

type StudyCardProps = {
  deckId: number;
  deckName: string;
  cards: CardData[];
  hasAIFeature: boolean;
};

export function StudyCard({
  deckId,
  deckName,
  cards: initialCards,
  hasAIFeature,
}: StudyCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyCards, setStudyCards] = useState(initialCards);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [incorrectCards, setIncorrectCards] = useState<CardData[]>([]);
  const [incorrectStreak, setIncorrectStreak] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const cardStartTime = useRef<number>(Date.now());

  // AI tutor state
  const [tutorText, setTutorText] = useState<string | null>(null);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorType, setTutorType] = useState<
    "hint" | "explain" | "whyWrong" | null
  >(null);

  // Weak areas state (completion modal)
  const [weakAreas, setWeakAreas] = useState<{
    weakThemes: string;
    actions: string[];
  } | null>(null);
  const [weakAreasLoading, setWeakAreasLoading] = useState(false);

  const currentCard = studyCards[currentIndex];
  const progress = ((currentIndex + 1) / studyCards.length) * 100;
  const totalAnswered = correctCount + incorrectCount;
  const accuracy =
    totalAnswered > 0
      ? Math.round((correctCount / totalAnswered) * 100)
      : 0;

  // Start a session on mount
  useEffect(() => {
    startSessionAction({
      deckId,
      totalCards: initialCards.length,
    }).then((session) => {
      setSessionId(session.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset card timer when card changes
  useEffect(() => {
    cardStartTime.current = Date.now();
  }, [currentIndex]);

  const clearTutor = () => {
    setTutorText(null);
    setTutorType(null);
  };

  const handleFlip = useCallback(() => {
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  const handleNext = useCallback(() => {
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      clearTutor();
    }
  }, [currentIndex, studyCards.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      clearTutor();
    }
  }, [currentIndex]);

  const recordResult = (cardId: number, isCorrect: boolean) => {
    if (!sessionId) return;
    const timeSpentMs = Date.now() - cardStartTime.current;
    recordCardResultAction({
      sessionId,
      cardId,
      isCorrect,
      timeSpentMs,
    });
  };

  const finishSession = (correct: number, incorrect: number) => {
    if (!sessionId) return;
    completeSessionAction({
      sessionId,
      correctCount: correct,
      incorrectCount: incorrect,
    });
  };

  const handleCorrect = () => {
    const newCorrect = correctCount + 1;
    setCorrectCount(newCorrect);
    setIncorrectStreak(0);
    recordResult(currentCard.id, true);
    clearTutor();
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      finishSession(newCorrect, incorrectCount);
      setShowCompletionModal(true);
    }
  };

  const handleIncorrect = () => {
    const newIncorrect = incorrectCount + 1;
    setIncorrectCount(newIncorrect);
    setIncorrectStreak((prev) => prev + 1);
    setIncorrectCards((prev) => [...prev, currentCard]);
    recordResult(currentCard.id, false);
    clearTutor();
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      finishSession(correctCount, newIncorrect);
      setShowCompletionModal(true);
    }
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCorrectCount(0);
    setIncorrectCount(0);
    setIncorrectCards([]);
    setIncorrectStreak(0);
    clearTutor();
    setWeakAreas(null);
    // Start a new session
    startSessionAction({
      deckId,
      totalCards: studyCards.length,
    }).then((session) => {
      setSessionId(session.id);
    });
  };

  const handleStudyAgain = () => {
    setShowCompletionModal(false);
    setStudyCards(initialCards);
    resetSession();
  };

  const handleStudyWeakOnly = () => {
    if (incorrectCards.length === 0) return;
    setShowCompletionModal(false);
    setStudyCards(incorrectCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCorrectCount(0);
    setIncorrectCount(0);
    setIncorrectCards([]);
    clearTutor();
    setWeakAreas(null);
    startSessionAction({
      deckId,
      totalCards: incorrectCards.length,
    }).then((session) => {
      setSessionId(session.id);
    });
  };

  const handleShuffle = () => {
    const shuffled = [...studyCards].sort(() => Math.random() - 0.5);
    setStudyCards(shuffled);
    resetSession();
  };

  const handleReset = () => {
    setStudyCards(initialCards);
    resetSession();
  };

  // --- AI Tutor handlers ---
  const handleHint = async () => {
    if (tutorLoading) return;
    setTutorLoading(true);
    setTutorType("hint");
    setTutorText(null);
    try {
      const hint = await getHintAction({ cardFront: currentCard.front });
      setTutorText(hint);
    } catch {
      setTutorText("Could not generate a hint. Please try again.");
    } finally {
      setTutorLoading(false);
    }
  };

  const handleExplain = async () => {
    if (tutorLoading) return;
    setTutorLoading(true);
    setTutorType("explain");
    setTutorText(null);
    try {
      const explanation = await getExplanationAction({
        cardFront: currentCard.front,
        cardBack: currentCard.back,
      });
      setTutorText(explanation);
    } catch {
      setTutorText("Could not generate an explanation. Please try again.");
    } finally {
      setTutorLoading(false);
    }
  };

  const handleWhyWrong = async () => {
    if (tutorLoading) return;
    setTutorLoading(true);
    setTutorType("whyWrong");
    setTutorText(null);
    try {
      const explanation = await getWhyWrongAction({
        cardFront: currentCard.front,
        cardBack: currentCard.back,
      });
      setTutorText(explanation);
    } catch {
      setTutorText("Could not generate an explanation. Please try again.");
    } finally {
      setTutorLoading(false);
    }
  };

  const handleGetWeakAreas = async () => {
    if (weakAreasLoading || incorrectCards.length === 0) return;
    setWeakAreasLoading(true);
    try {
      const result = await getImproveWeakAreasAction({
        deckName,
        accuracy,
        incorrectCards: incorrectCards.map((c) => ({
          front: c.front,
          back: c.back,
        })),
      });
      setWeakAreas(result);
    } catch {
      setWeakAreas({
        weakThemes: "Could not analyze weak areas.",
        actions: [],
      });
    } finally {
      setWeakAreasLoading(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        handleFlip();
      } else if (event.code === "ArrowLeft") {
        handlePrevious();
      } else if (event.code === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    currentIndex,
    isFlipped,
    studyCards.length,
    handleFlip,
    handleNext,
    handlePrevious,
  ]);

  const tutorLabel =
    tutorType === "hint"
      ? "Hint"
      : tutorType === "explain"
        ? "Explanation"
        : tutorType === "whyWrong"
          ? "Why Wrong?"
          : "";

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex flex-col gap-6 max-w-[800px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost">
            <Link
              href={`/decks/${deckId}`}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Deck
            </Link>
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleShuffle}>
              <Shuffle className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Deck Name and Score */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">{deckName}</h1>
          <div className="flex items-center justify-center gap-6 mt-2">
            <p className="text-sm text-muted-foreground">
              Card {currentIndex + 1} of {studyCards.length}
            </p>
            <p className="text-sm text-muted-foreground">
              {correctCount} correct, {incorrectCount} incorrect
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="h-2" />

        {/* Keyboard Shortcuts Hint */}
        <div className="text-center text-sm text-muted-foreground">
          Use &larr; &rarr; arrow keys to navigate &bull; Spacebar to flip
        </div>

        {/* Flashcard */}
        <div className="flex flex-col items-center gap-6 py-4">
          <Card
            className="w-full max-w-[600px] min-h-[400px] cursor-pointer bg-zinc-900/50 border-zinc-800 transition-all hover:border-zinc-700"
            onClick={handleFlip}
          >
            <CardContent className="flex items-center justify-center p-12 min-h-[400px]">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-4">
                  {isFlipped ? "Back" : "Front"}
                </p>
                <p className="text-2xl leading-relaxed">
                  {isFlipped ? currentCard.back : currentCard.front}
                </p>
                {!isFlipped && (
                  <p className="text-sm text-muted-foreground mt-6">
                    Click or press Space to reveal answer
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Tutor Buttons */}
          {hasAIFeature && (
            <div className="flex gap-2 w-full max-w-[600px] justify-center">
              {!isFlipped && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleHint}
                  disabled={tutorLoading}
                  className="text-xs"
                >
                  {tutorLoading && tutorType === "hint" ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Lightbulb className="h-3 w-3 mr-1" />
                  )}
                  Hint
                </Button>
              )}
              {isFlipped && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExplain}
                    disabled={tutorLoading}
                    className="text-xs"
                  >
                    {tutorLoading && tutorType === "explain" ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <BookOpen className="h-3 w-3 mr-1" />
                    )}
                    Explain
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleWhyWrong}
                    disabled={tutorLoading}
                    className="text-xs"
                  >
                    {tutorLoading && tutorType === "whyWrong" ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <HelpCircle className="h-3 w-3 mr-1" />
                    )}
                    Why Wrong?
                  </Button>
                </>
              )}
            </div>
          )}

          {/* AI Tutor Response */}
          {(tutorText || (tutorLoading && tutorType)) && (
            <div className="w-full max-w-[600px] bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {tutorLabel}
              </p>
              {tutorLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              ) : (
                <p className="text-sm leading-relaxed">{tutorText}</p>
              )}
            </div>
          )}

          {/* Navigation / Answer Buttons */}
          {!isFlipped ? (
            <div className="flex gap-4 w-full max-w-[600px]">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleFlip}
              >
                Flip Card
              </Button>
              <Button
                className="flex-1 bg-white hover:bg-zinc-100 text-zinc-900"
                onClick={handleNext}
                disabled={currentIndex === studyCards.length - 1}
              >
                Next
              </Button>
            </div>
          ) : (
            <div className="flex gap-4 w-full max-w-[600px]">
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleIncorrect}
              >
                <X className="h-4 w-4 mr-2" />
                Incorrect
              </Button>
              <Button
                className="flex-1 bg-white hover:bg-zinc-100 text-zinc-900"
                onClick={handleCorrect}
              >
                <Check className="h-4 w-4 mr-2" />
                Correct
              </Button>
            </div>
          )}
        </div>

        {/* Completion Modal */}
        <Dialog
          open={showCompletionModal}
          onOpenChange={setShowCompletionModal}
        >
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                Study Session Complete!
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-6">
                Great job studying {deckName}
              </p>

              {/* Stats */}
              <div className="flex justify-center gap-12 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">
                    {correctCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-500">
                    {incorrectCount}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Incorrect
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{accuracy}%</div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
              </div>

              {/* Weak Cards List */}
              {incorrectCards.length > 0 && (
                <div className="text-left mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <h3 className="text-sm font-semibold">
                      Cards to Review ({incorrectCards.length})
                    </h3>
                  </div>
                  <div className="space-y-2 max-h-[140px] overflow-y-auto">
                    {incorrectCards.map((card) => (
                      <div
                        key={card.id}
                        className="bg-zinc-800/50 rounded-md px-3 py-2 text-sm"
                      >
                        <span className="text-muted-foreground">Q: </span>
                        {card.front}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Weak Areas Analysis */}
              {hasAIFeature && incorrectCards.length > 0 && (
                <div className="text-left mb-6">
                  {!weakAreas && !weakAreasLoading && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleGetWeakAreas}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Analyze Weak Areas with AI
                    </Button>
                  )}
                  {weakAreasLoading && (
                    <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing your weak areas...
                    </div>
                  )}
                  {weakAreas && (
                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-3">
                      <h4 className="text-sm font-semibold">
                        Weak Areas
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {weakAreas.weakThemes}
                      </p>
                      {weakAreas.actions.length > 0 && (
                        <>
                          <h4 className="text-sm font-semibold">
                            Next Steps
                          </h4>
                          <ul className="space-y-1">
                            {weakAreas.actions.map((action, i) => (
                              <li
                                key={i}
                                className="text-sm text-muted-foreground flex items-start gap-2"
                              >
                                <span className="text-zinc-400 mt-0.5">
                                  {i + 1}.
                                </span>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                {incorrectCards.length > 0 && (
                  <Button
                    className="w-full bg-white hover:bg-zinc-100 text-zinc-900"
                    onClick={handleStudyWeakOnly}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Study Weak Cards Only ({incorrectCards.length})
                  </Button>
                )}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleStudyAgain}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Study Again
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/decks/${deckId}`}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Deck
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Floating Tutor Button */}
        {hasAIFeature && !showCompletionModal && (
          <FloatingTutorButton
            incorrectStreak={incorrectStreak}
            onClick={() => {
              if (isFlipped) {
                handleExplain();
              } else {
                handleHint();
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
