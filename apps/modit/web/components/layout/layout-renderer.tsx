"use client";

import type { Section } from "@/lib/layout-types";
import { WIDGET_REGISTRY } from "./layout-registry";

// ── Layout Renderer ─────────────────────────────────────────────────
// Walks the sections array from the backend JSON and renders each widget.
// Unknown types are safely skipped (forward compatibility).

export function LayoutRenderer({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections
        .filter((s) => s.visible)
        .sort((a, b) => a.order - b.order)
        .map((section) => {
          const Widget = WIDGET_REGISTRY[section.type];
          if (!Widget) {
            // Unknown section type — skip silently (forward compatibility)
            if (process.env.NODE_ENV === "development") {
              console.warn(`[LayoutRenderer] Unknown section type: ${section.type}`);
            }
            return null;
          }
          return <Widget key={section.id} data={section.data} />;
        })}
    </>
  );
}
