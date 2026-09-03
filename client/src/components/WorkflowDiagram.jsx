import React from "react";
import { motion } from "framer-motion";

/**
 * Renders a vertical sequence of stages, each revealed on scroll with a
 * connecting line that draws itself between steps. Used on the landing page
 * for the Donor -> Allocation workflow, and reused (with different stage
 * lists) for the live matching animation and allocation timeline.
 */
export default function WorkflowDiagram({ stages, activeIndex = -1, orientation = "vertical" }) {
  const isVertical = orientation === "vertical";

  return (
    <div className={isVertical ? "flex flex-col" : "flex flex-row overflow-x-auto"}>
      {stages.map((stage, i) => {
        const isDone = activeIndex >= 0 && i < activeIndex;
        const isActive = i === activeIndex;
        return (
          <div key={stage.label} className={isVertical ? "flex" : "flex flex-col items-center min-w-[140px]"}>
            <div className={isVertical ? "flex flex-col items-center mr-6" : "flex flex-row items-center"}>
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors duration-500
                  ${
                    isActive
                      ? "border-forest-600 bg-forest-600 text-warmwhite shadow-lifted"
                      : isDone
                      ? "border-forest-300 bg-forest-100 text-forest-700"
                      : "border-stone-300 bg-white text-stone-400"
                  }`}
              >
                {stage.icon ? <stage.icon size={18} strokeWidth={1.75} /> : i + 1}
              </motion.div>
              {i < stages.length - 1 && (
                <motion.div
                  initial={isVertical ? { scaleY: 0 } : { scaleX: 0 }}
                  whileInView={isVertical ? { scaleY: 1 } : { scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.08 + 0.15 }}
                  style={{ transformOrigin: isVertical ? "top" : "left" }}
                  className={
                    isVertical
                      ? `w-px flex-1 min-h-[36px] ${isDone || isActive ? "bg-forest-400" : "bg-stone-200"}`
                      : `h-px flex-1 min-w-[24px] mt-6 ${isDone ? "bg-forest-400" : "bg-stone-200"}`
                  }
                />
              )}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 + 0.1 }}
              className={isVertical ? "pb-10" : "pt-3 text-center px-2"}
            >
              <p className={`text-sm font-medium ${isActive ? "text-forest-700" : "text-charcoal"}`}>{stage.label}</p>
              {stage.description && <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-stone-500">{stage.description}</p>}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
