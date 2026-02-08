"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";

type FloatingTutorButtonProps = {
  incorrectStreak?: number;
  onClick: () => void;
};

export function FloatingTutorButton({
  incorrectStreak = 0,
  onClick,
}: FloatingTutorButtonProps) {
  const shouldPulse = incorrectStreak >= 2;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              onClick={onClick}
              className={`h-12 w-12 rounded-full shadow-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 ${
                shouldPulse ? "animate-pulse ring-2 ring-zinc-500" : ""
              }`}
            >
              <Sparkles className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>
              {shouldPulse
                ? "Struggling? Get a hint from the AI Tutor"
                : "AI Tutor"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
