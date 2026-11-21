import { useEffect, useState } from "react";

function hueFor(title: string): number {
  let hash = 0;
  for (let index = 0; index < title.length; index += 1) {
    hash = (hash * 31 + title.charCodeAt(index)) % 360;
  }
  return hash;
}

// Locally uploaded covers are stored as /api/covers/<uuid> without an
// extension. In dev the server only dispatches non-asset requests to the app,
// so <img> can't load them directly — fetch them as a blob instead.
function useLocalCoverSrc(coverUrl: string | null): string | null {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!coverUrl || !coverUrl.startsWith("/api/covers/")) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    fetch(coverUrl)
      .then((response) => (response.ok ? response.blob() : null))
      .then((blob) => {
        if (cancelled || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [coverUrl]);
  return blobUrl;
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
  const localSrc = useLocalCoverSrc(coverUrl);
  const src =
    coverUrl?.startsWith("/api/covers/") === true ? localSrc : coverUrl;
  const hue = hueFor(title);

  if (!src || failed) {
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
      src={src}
      alt={`${title} box art`}
      className={`object-cover ${className}`}
      loading={eager ? "eager" : "lazy"}
      onError={() => setFailed(true)}
    />
  );
}
