"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GraduationCap, Loader2 } from "lucide-react";
import { getPlanLearningAction } from "@/actions/tutor-actions";

type PlanLearningDialogProps = {
  deckName: string;
  deckDescription: string | null;
};

export function PlanLearningDialog({
  deckName,
  deckDescription,
}: PlanLearningDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<{
    clarification: string;
    subSkills: string[];
    suggestedApproach: string;
  } | null>(null);

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !plan) {
      setLoading(true);
      try {
        const result = await getPlanLearningAction({
          deckName,
          deckDescription: deckDescription ?? undefined,
        });
        setPlan(result);
      } catch {
        setPlan({
          clarification: "Could not generate a learning plan.",
          subSkills: [],
          suggestedApproach: "",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <GraduationCap className="h-3 w-3 mr-1" />
          Plan Learning
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Learning Plan: {deckName}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Building your plan...
          </div>
        ) : plan ? (
          <div className="space-y-4 py-2">
            <div>
              <h3 className="text-sm font-semibold mb-1">Topic Overview</h3>
              <p className="text-sm text-muted-foreground">
                {plan.clarification}
              </p>
            </div>
            {plan.subSkills.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-1">
                  Sub-Skills to Master
                </h3>
                <ul className="space-y-1">
                  {plan.subSkills.map((skill, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-zinc-400 mt-0.5">
                        {i + 1}.
                      </span>
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {plan.suggestedApproach && (
              <div>
                <h3 className="text-sm font-semibold mb-1">
                  Suggested Approach
                </h3>
                <p className="text-sm text-muted-foreground">
                  {plan.suggestedApproach}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
