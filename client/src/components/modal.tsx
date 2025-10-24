"use client";

import { Dispatch, ReactNode, SetStateAction } from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

interface ModalProps {
  children?: ReactNode;
  className?: string;
  showModal?: boolean;
  setShowModal?: Dispatch<SetStateAction<boolean>>;
  onClose?: () => void;
  preventDefaultClose?: boolean;
  title?: string;
}

export const Modal = ({
  children,
  className,
  onClose,
  preventDefaultClose,
  setShowModal,
  showModal,
  title = "Drawer",
}: ModalProps) => {
  const closeModal = ({ dragged }: { dragged?: boolean }) => {
    if (preventDefaultClose && !dragged) return;

    onClose?.();

    if (setShowModal) {
      setShowModal(false);
    }
  };

  return (
    <Drawer.Root
      open={setShowModal ? showModal : true}
      onOpenChange={(open) => {
        if (!open) {
          closeModal({ dragged: true });
        }
      }}
    >
      <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />

      <Drawer.Portal>
        <Drawer.Content
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 mt-24 rounded-t-2xl border-t border-border/50 bg-card/95 backdrop-blur-lg shadow-lg",
            className
          )}
        >
          <div className="sticky top-0 z-20 flex w-full items-center justify-center rounded-t-2xl bg-inherit">
            <div className="my-3 h-1 w-12 rounded-full bg-gray-300" />
          </div>

          {title && (
            <h2 className="text-center text-lg font-semibold text-foreground mb-2">
              {title}
            </h2>
          )}

          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
