import { AlertTriangle } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"

interface ConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    title: string
    description?: string
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive"
    children?: React.ReactNode
}

export function ConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "default",
    children
}: ConfirmDialogProps) {
    const handleConfirm = () => {
        onConfirm()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        {variant === "destructive" && (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                        )}
                        <DialogTitle>{title}</DialogTitle>
                    </div>
                    {description && (
                        <DialogDescription className="pt-2">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                {children && (
                    <div className="py-4">
                        {children}
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
