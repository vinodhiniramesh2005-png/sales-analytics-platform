"use client";

import { useEffect, useState } from "react";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    let frame: number;
    function step(ts: number) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

export default function KpiCard({
  label,
  value,
  prefix = "",
  suffix = "",
  icon: Icon,
  decimals = 0,
  accentColor = "accent",
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  decimals?: number;
  accentColor?: "accent" | "success" | "warning" | "danger";
}) {
  const animated = useCountUp(value);

  const colorMap = {
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted dark:text-muted-dark font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[accentColor]}`}>
          <Icon size={17} />
        </div>
      </div>
      <div className="num text-2xl font-semibold tracking-tight">
        {prefix}
        {animated.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
        {suffix}
      </div>
    </motion.div>
  );
}
