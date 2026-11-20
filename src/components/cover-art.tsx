import { useState } from "react";

function hueFor(title: string): number {
  let hash = 0;
  for (let index = 0; index < title.length; index += 1) {
    hash = (hash * 31 + title.charCodeAt(index)) % 360;
  }
  return hash;
}

type CoverArtProps = {
  title: string;
  coverUrl: string | null;
  className?: string;
  eager?: boolean;
};

export function CoverArt({
  title,
  coverUrl,
  className = "",
  eager = false,
}: CoverArtProps) {
  const [failed, setFailed] = useState(false);
  const hue = hueFor(title);

  if (!coverUrl || failed) {
    return (
      <div
        className={`cover-fallback flex items-center justify-center overflow-hidden ${className}`}
        style={{
          background: `linear-gradient(145deg, hsl(${hue} 32% 28%), hsl(${(hue + 38) % 360} 42% 16%))`,
        }}
        role="img"
        aria-label={`${title} placeholder cover`}
      >
        <span className="display px-4 text-center text-2xl text-cream/90">
          {title}
        </span>
      </div>
    );
  }

  return (
    <img
      src={coverUrl}
      alt={`${title} box art`}
      className={`object-cover ${className}`}
      loading={eager ? "eager" : "lazy"}
      onError={() => setFailed(true)}
    />
  );
}
