"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl p-8 shadow-sm transition-shadow duration-300 hover:shadow-lg",
  {
    variants: {
      gradient: {
        orange: "bg-linear-to-br from-orange-100 to-amber-200/50",
        gray: "bg-linear-to-br from-slate-100 to-slate-200/50",
        purple: "bg-linear-to-br from-purple-100 to-indigo-200/50",
        green: "bg-linear-to-br from-emerald-100 to-teal-200/50",
      },
    },
    defaultVariants: { gradient: "gray" },
  },
);

export interface GradientCardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  badgeText: string;
  badgeColor: string;
  title: string;
  description: string;
  ctaText?: string;
  ctaHref?: string;
  imageUrl: string;
  imageAlt?: string;
}

const GradientCard = React.forwardRef<HTMLDivElement, GradientCardProps>(
  ({ className, gradient, badgeText, badgeColor, title, description, ctaText, ctaHref, imageUrl, imageAlt = "", ...props }, ref) => {
    const reducedMotion = useReducedMotion();
    return (
      <motion.div
        className="gradient-card-motion h-full"
        initial="rest"
        animate="rest"
        whileHover={reducedMotion ? undefined : "hover"}
        variants={{ rest: { scale: 1, y: 0 }, hover: { scale: 1.015, y: -3 } }}
        transition={{ type: "spring", stiffness: 180, damping: 24 }}
      >
        <div ref={ref} data-gradient-card className={cn(cardVariants({ gradient }), className)} {...props}>
          <motion.img
            src={imageUrl}
            alt={imageAlt}
            aria-hidden={imageAlt ? undefined : true}
            width={1280}
            height={1280}
            loading="lazy"
            decoding="async"
            draggable={false}
            variants={{ rest: { scale: 1, rotate: 0 }, hover: { scale: 1.045, rotate: 2 } }}
            transition={{ type: "spring", stiffness: 160, damping: 23 }}
            className="gradient-card-image pointer-events-none absolute -right-1/4 -bottom-1/4 w-3/4"
          />
          <div className="gradient-card-content relative z-10 flex h-full flex-col">
            <div className="gradient-card-badge mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-background/50 px-3 py-1 text-sm font-medium text-foreground/80 backdrop-blur-sm">
              <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: badgeColor }} />
              {badgeText}
            </div>
            <div className="gradient-card-copy grow">
              <h3 className="mb-2 text-2xl font-bold text-foreground">{title}</h3>
              <p className="max-w-xs text-foreground/70">{description}</p>
            </div>
            {ctaText && ctaHref && (
              <a href={ctaHref} className="group mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-4">
                {ctaText}
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" />
              </a>
            )}
          </div>
        </div>
      </motion.div>
    );
  },
);
GradientCard.displayName = "GradientCard";

export { GradientCard, cardVariants };
