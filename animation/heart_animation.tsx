"use client";
import { useEffect, useState } from "react";

interface HeartAnimationProps {
  isLoading: boolean;
}

const FOOD_EMOJIS = [
  "🍕",
  "🍔",
  "🍟",
  "🌭",
  "🍿",
  "🥗",
  "🍣",
  "🍩",
  "🍦",
  "🍉",
  "🍎",
  "🍪",
  "🍰",
  "🍫",
  "🍜",
  "🍤",
  "🍚",
  "🍛",
  "🍝",
  "🍱",
  "🍲",
  "🍛",
  "🍙",
  "🍘",
  "🍥",
  "🥮",
  "🥟",
  "🥠",
  "🥡",
  "🍧",
  "🍨",
  "🍮",
  "🍯",
  "🍞",
  "🥐",
  "🥖",
  "🥨",
  "🥯",
  "🥞",
  "🧇",
  "🧀",
  "🍗",
  "🍖",
  "🥩",
  "🥓",
  "🍔",
  "🌮",
  "🌯",
  "🥙",
  "🍜",
];

export default function HeartAnimation({ isLoading }: HeartAnimationProps) {
  // For animated loading dots (food emojis)
  const [dotCount, setDotCount] = useState(1);
  const [dotEmojis, setDotEmojis] = useState<string[]>([]);

  useEffect(() => {
    if (isLoading) {
      // Loading bar foods
      const shuffled = [...FOOD_EMOJIS].sort(() => 0.5 - Math.random());
      setDotEmojis(shuffled.slice(0, 5));
      setDotCount(1);
    }
  }, [isLoading]);

  // Animate the food "dots"
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setDotCount((prev) => (prev % 5) + 1);
    }, 400);
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden">
      {/* Loading text with animated food "dots" */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-800 mb-2">
            Loading Expenses
          </div>
          <div className="text-4xl transition-all duration-200">
            {dotEmojis.slice(0, dotCount).map((emoji, i) => (
              <span key={i}>{emoji}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}