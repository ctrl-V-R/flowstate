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

export function TerminalDialog({ 
  open,
  onOpenChange, 
  onConfirm,
  command
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void, 
  onConfirm: () => void
  command: string
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-zinc-950 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400 text-lg">
            This is a dangerous command and should be run with discretion.  
            <br></br>
            <span className="text-white" >Please confirm that you want to execute:</span>
            <span className="text-red-500 font-mono text-lg"> {command}</span>
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
            Run it!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}