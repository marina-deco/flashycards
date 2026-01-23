"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, RotateCcw, Shuffle, Check, X } from "lucide-react";
import Link from "next/link";

type CardData = {
  id: number;
  front: string;
  back: string;
};

type StudyCardProps = {
  deckId: number;
  deckName: string;
  cards: CardData[];
};

export function StudyCard({ deckId, deckName, cards }: StudyCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyCards, setStudyCards] = useState(cards);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const currentCard = studyCards[currentIndex];
  const progress = ((currentIndex + 1) / studyCards.length) * 100;
  const totalAnswered = correctCount + incorrectCount;
  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCorrectCount(0);
    setIncorrectCount(0);
  };

  const handleShuffle = () => {
    const shuffled = [...studyCards].sort(() => Math.random() - 0.5);
    setStudyCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCorrectCount(0);
    setIncorrectCount(0);
  };

  const handleCorrect = () => {
    setCorrectCount(correctCount + 1);
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      // Last card - show completion modal
      setShowCompletionModal(true);
    }
  };

  const handleIncorrect = () => {
    setIncorrectCount(incorrectCount + 1);
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      // Last card - show completion modal
      setShowCompletionModal(true);
    }
  };

  const handleStudyAgain = () => {
    setShowCompletionModal(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCorrectCount(0);
    setIncorrectCount(0);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for spacebar to avoid page scroll
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

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentIndex, isFlipped, studyCards.length]); // Dependencies for the handlers

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex flex-col gap-6 max-w-[800px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost">
            <Link href={`/decks/${deckId}`} className="flex items-center gap-2">
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
          Use ← → arrow keys to navigate • Spacebar to flip
        </div>

        {/* Flashcard */}
        <div className="flex flex-col items-center gap-6 py-8">
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

          {/* Navigation Buttons */}
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
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleCorrect}
              >
                <Check className="h-4 w-4 mr-2" />
                Correct
              </Button>
            </div>
          )}

        </div>

        {/* Completion Modal */}
        <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">Study Session Complete!</DialogTitle>
            </DialogHeader>
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-8">
                Great job studying {deckName}
              </p>

              {/* Stats */}
              <div className="flex justify-center gap-12 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">{correctCount}</div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-500">{incorrectCount}</div>
                  <div className="text-sm text-muted-foreground">Incorrect</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{accuracy}%</div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleStudyAgain}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Study Again
                </Button>
                <Button 
                  asChild 
                  variant="outline"
                  className="flex-1"
                >
                  <Link href={`/decks/${deckId}`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Deck
                  </Link>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
