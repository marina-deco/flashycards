"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Sparkles, Loader2 } from "lucide-react"
import { generateCardsWithAIAction } from "../actions"

interface GenerateCardsDialogProps {
  deckId: number
  deckName: string
  deckDescription: string | null
  hasAIFeature: boolean
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function GenerateCardsDialog({
  deckId,
  deckName,
  deckDescription,
  hasAIFeature,
  variant = "default",
  size = "default",
  className,
}: GenerateCardsDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const hasDescription = deckDescription && deckDescription.trim() !== ""

  const handleGenerate = async () => {
    setIsLoading(true)
    try {
      await generateCardsWithAIAction({
        deckId,
        deckName,
        deckDescription: deckDescription!,
      })
      setOpen(false)
    } catch (error) {
      console.error("Failed to generate cards:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Free user - show tooltip and redirect to pricing
  if (!hasAIFeature) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className={className}
              onClick={() => router.push("/pricing")}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate with AI
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>This is a Pro feature. Click to upgrade.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Pro user without description - show disabled button with tooltip
  if (!hasDescription) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-block">
              <Button 
                variant={variant} 
                size={size} 
                className={className} 
                disabled
                style={{ pointerEvents: 'none' }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate with AI
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add a deck description first to use AI generation.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Pro user with description - show dialog to generate cards
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Sparkles className="h-4 w-4 mr-2" />
          Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Cards with AI</DialogTitle>
          <DialogDescription>
            AI will generate 20 flashcards based on your deck title and
            description.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Deck:</span> {deckName}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Description:</span>{" "}
              {deckDescription}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate 20 Cards
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
