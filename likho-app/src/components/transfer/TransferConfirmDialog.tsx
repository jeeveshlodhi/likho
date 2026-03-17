import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Cloud, HardDrive } from 'lucide-react';
import type { SpaceType } from '@/types/workspace';

interface TransferConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  /** Total number of notes + sub-folders being transferred. */
  itemCount: number;
  fromSpace: SpaceType;
  toSpace: SpaceType;
}

export default function TransferConfirmDialog({
  open,
  onClose,
  onConfirm,
  itemName,
  itemCount,
  fromSpace,
  toSpace,
}: TransferConfirmDialogProps) {
  const toLabel = toSpace === 'online' ? 'Online Space' : 'Offline Space';
  const fromLabel = fromSpace === 'online' ? 'Online Space' : 'Offline Space';
  const ToIcon = toSpace === 'online' ? Cloud : HardDrive;

  const itemDescription =
    itemCount === 1
      ? '1 item'
      : `${itemCount} items`;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ToIcon size={16} />
            Move to {toLabel}
          </DialogTitle>
          <DialogDescription className="space-y-1 pt-1 text-sm">
            <span className="block">
              Move <strong>"{itemName}"</strong> and its {itemDescription} to {toLabel}?
            </span>
            <span className="block text-muted-foreground">
              All content will remain intact. Items will be removed from {fromLabel}.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onClose();
              onConfirm();
            }}
          >
            <ToIcon size={14} className="mr-1.5" />
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
