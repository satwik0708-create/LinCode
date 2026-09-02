"use client";

import { motion, type Variants } from "framer-motion";
import React from "react";

/**
 * Staggered reveal container (motion-primitives / ibelick "animated-group").
 * Wraps each child so a list of elements animates in sequence.
 */

export type PresetType = "fade" | "slide" | "scale" | "blur" | "blur-slide" | "zoom" | "flip" | "bounce" | "rotate" | "swing";

export type AnimatedGroupProps = {
  children: React.ReactNode;
  className?: string;
  variants?: { container?: Variants; item?: Variants };
  preset?: PresetType;
  as?: keyof React.JSX.IntrinsicElements;
  asChild?: keyof React.JSX.IntrinsicElements;
};

const defaultContainerVariants: Variants = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const defaultItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const presetVariants: Record<PresetType, Variants> = {
  fade: {},
  slide: { hidden: { y: 20 }, visible: { y: 0 } },
  scale: { hidden: { scale: 0.8 }, visible: { scale: 1 } },
  blur: { hidden: { filter: "blur(4px)" }, visible: { filter: "blur(0px)" } },
  "blur-slide": { hidden: { filter: "blur(4px)", y: 20 }, visible: { filter: "blur(0px)", y: 0 } },
  zoom: { hidden: { scale: 0.5 }, visible: { scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } } },
  flip: { hidden: { rotateX: -90 }, visible: { rotateX: 0, transition: { type: "spring", stiffness: 300, damping: 20 } } },
  bounce: { hidden: { y: -50 }, visible: { y: 0, transition: { type: "spring", stiffness: 400, damping: 10 } } },
  rotate: { hidden: { rotate: -180 }, visible: { rotate: 0, transition: { type: "spring", stiffness: 200, damping: 15 } } },
  swing: { hidden: { rotate: -10 }, visible: { rotate: 0, transition: { type: "spring", stiffness: 300, damping: 8 } } },
};

function addDefaultVariants(variants: Variants): Variants {
  return {
    hidden: { ...defaultItemVariants.hidden, ...variants.hidden },
    visible: { ...defaultItemVariants.visible, ...variants.visible },
  };
}

export function AnimatedGroup({ children, className, variants, preset, as = "div", asChild = "div" }: AnimatedGroupProps) {
  const selectedVariants = {
    item: addDefaultVariants(preset ? presetVariants[preset] : {}),
    container: addDefaultVariants(defaultContainerVariants),
  };
  const containerVariants = variants?.container || selectedVariants.container;
  const itemVariants = variants?.item || selectedVariants.item;

  const MotionComponent = React.useMemo(() => motion[as as keyof typeof motion] as typeof motion.div, [as]);
  const MotionChild = React.useMemo(() => motion[asChild as keyof typeof motion] as typeof motion.div, [asChild]);

  return (
    <MotionComponent initial="hidden" animate="visible" variants={containerVariants} className={className}>
      {React.Children.map(children, (child, index) => (
        <MotionChild key={index} variants={itemVariants}>
          {child}
        </MotionChild>
      ))}
    </MotionComponent>
  );
}
