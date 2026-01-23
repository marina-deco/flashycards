"use client"

import { useState } from "react"
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
import { Trash2 } from "lucide-react"
import { deleteDeckAction } from "../actions"

interface DeleteDeckDialogProps {
  deckId: number
  deckName: string
  variant?: "default" | "outline" | "ghost" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export function DeleteDeckDialog({ 
  deckId, 
  deckName,
  variant = "outline", 
  size = "sm" 
}: DeleteDeckDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteDeckAction({ deckId })
      // No need to setOpen(false) or handle redirect - the action does it
    } catch (error) {
      console.error("Failed to delete deck:", error)
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Deck</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this deck? All cards in this deck will also be deleted. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-zinc-800/50 rounded-md p-3 my-4">
          <div className="text-sm font-medium mb-2">Deck Name:</div>
          <div className="text-sm">{deckName}</div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Deck"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
