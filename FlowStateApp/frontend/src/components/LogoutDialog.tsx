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

export function LogoutDialog({ 
  open, 
  onOpenChange, 
  onConfirm
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void, 
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-zinc-950 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Log Out?</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            This will log you out from this session. 
            You can come back to your configured dashboard by using the same Session ID.
            <span className="text-white font-medium" >Any inactive sessions will be deleted after 24 hours.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            Log Out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}