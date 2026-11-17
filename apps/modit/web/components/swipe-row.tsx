"use client";

import { useRef, useState, type ReactNode } from "react";
import { animate, motion, useMotionValue } from "motion/react";
import { Heart, Trash2 } from "lucide-react";
import { haptic } from "@/lib/haptics";

/** One revealed action button's width — two actions max. */
const ACTION_W = 88;
const SPRING = { type: "spring", stiffness: 420, damping: 38 } as const;

/**
 * Native-style swipeable row: drag the content left to reveal
 * "Save for later" + "Remove" behind it. Springs shut on partial drags,
 * stays open past the commit point (with a haptic tick), and slides the
 * row away when Remove is chosen. The original in-row action buttons stay
 * in the DOM untouched, so desktop users never lose their controls.
 */
export function SwipeRow({
  children,
  onSave,
  onRemove,
  className = "",
}: {
  children: ReactNode;
  onSave?: () => void;
  onRemove?: () => void;
  className?: string;
}) {
  const x = useMotionValue(0);
  const opacity = useMotionValue(1);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const open = useRef(false);
  const [leaving, setLeaving] = useState(false);
  const actions = (onSave ? 1 : 0) + (onRemove ? 1 : 0);
  const maxX = -(ACTION_W * actions);

  if (actions === 0) return <>{children}</>;

  const shut = () => {
    open.current = false;
    animate(x, 0, SPRING);
  };

  const handleRemove = () => {
    if (leaving || !onRemove) return;
    setLeaving(true);
    haptic("delete");
    const w = contentRef.current?.offsetWidth ?? 640;
    animate(x, -w, { duration: 0.22, ease: "easeIn" });
    animate(opacity, 0, { duration: 0.22, ease: "easeIn" });
    setTimeout(onRemove, 200);
  };

  const handleSave = () => {
    if (!onSave) return;
    haptic("light");
    shut();
    setTimeout(onSave, 160);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Actions revealed behind the content */}
      <div className="absolute inset-y-0 right-0 flex" aria-hidden="true">
        {onSave && (
          <button
            type="button"
            tabIndex={-1}
            onClick={handleSave}
            className="flex h-full w-[88px] flex-col items-center justify-center gap-1 bg-[#7CB518] text-white"
          >
            <Heart className="h-4 w-4" />
            <span className="text-micro font-black tracking-wide">SAVE</span>
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            tabIndex={-1}
            onClick={handleRemove}
            className="flex h-full w-[88px] flex-col items-center justify-center gap-1 bg-[#E91E63] text-white"
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-micro font-black tracking-wide">REMOVE</span>
          </button>
        )}
      </div>

      <motion.div
        ref={contentRef}
        style={{ x, opacity }}
        drag="x"
        dragDirectionLock
        dragMomentum={false}
        dragConstraints={{ left: maxX, right: 0 }}
        dragElastic={0.08}
        onDragEnd={(_, info) => {
          const shouldOpen = info.offset.x < maxX * 0.55 || info.velocity.x < -420;
          if (shouldOpen) {
            if (!open.current) haptic("light");
            open.current = true;
            animate(x, maxX, SPRING);
          } else {
            shut();
          }
        }}
        onClickCapture={(e) => {
          // While the actions are revealed, a tap anywhere just closes the row.
          if (open.current) {
            e.preventDefault();
            e.stopPropagation();
            shut();
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
