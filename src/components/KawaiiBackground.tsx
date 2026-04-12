import { useEffect, useState } from "react";

interface FloatingElement {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

const EMOJIS = ["⭐", "💖", "☁️", "🌸", "✨", "💫", "🎀", "🩷"];

function generateElements(count: number): FloatingElement[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 10 + Math.random() * 14,
    duration: 12 + Math.random() * 20,
    delay: Math.random() * -20,
    opacity: 0.15 + Math.random() * 0.2,
  }));
}

export default function KawaiiBackground() {
  const [elements] = useState(() => generateElements(14));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {elements.map((el) => (
        <span
          key={el.id}
          className="absolute animate-kawaii-drift select-none"
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            fontSize: `${el.size}px`,
            opacity: el.opacity,
            animationDuration: `${el.duration}s`,
            animationDelay: `${el.delay}s`,
          }}
        >
          {el.emoji}
        </span>
      ))}
    </div>
  );
}
