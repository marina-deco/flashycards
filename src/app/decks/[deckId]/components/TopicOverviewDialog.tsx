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
import { BookOpen, Loader2 } from "lucide-react";
import { getTopicOverviewAction } from "@/actions/tutor-actions";

type TopicOverviewDialogProps = {
  deckName: string;
  deckDescription: string | null;
};

export function TopicOverviewDialog({
  deckName,
  deckDescription,
}: TopicOverviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<{
    summary: string;
    keyConcepts: string[];
    connections: string;
  } | null>(null);

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !overview) {
      setLoading(true);
      try {
        const result = await getTopicOverviewAction({
          deckName,
          deckDescription: deckDescription ?? undefined,
        });
        setOverview(result);
      } catch {
        setOverview({
          summary: "Could not generate topic overview.",
          keyConcepts: [],
          connections: "",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <BookOpen className="h-4 w-4 mr-2" />
          Understand Topic
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
        <DialogHeader>
          <DialogTitle>Understanding: {deckName}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Analyzing topic...
          </div>
        ) : overview ? (
          <div className="space-y-4 py-2">
            <div>
              <h3 className="text-sm font-semibold mb-1">Summary</h3>
              <p className="text-sm text-muted-foreground">
                {overview.summary}
              </p>
            </div>
            {overview.keyConcepts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Key Concepts</h3>
                <ul className="space-y-1">
                  {overview.keyConcepts.map((concept, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-zinc-400 mt-0.5">&bull;</span>
                      {concept}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {overview.connections && (
              <div>
                <h3 className="text-sm font-semibold mb-1">
                  How They Connect
                </h3>
                <p className="text-sm text-muted-foreground">
                  {overview.connections}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
