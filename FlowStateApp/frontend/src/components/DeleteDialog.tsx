import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { DeleteDialogProps } from "@/types";
import { Loader2 } from "lucide-react";

export function DeleteDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  endpointName,
  isLoading
}: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-zinc-950 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Delete Connection?</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            This will permanently remove <span className="text-white font-medium">{endpointName}</span>. 
            All associated flow history for this instance will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            className="bg-red-600 hover:bg-red-700 text-white font-bold"
            onClick={onConfirm}
            disabled={isLoading}
          >{isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Confirm Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}