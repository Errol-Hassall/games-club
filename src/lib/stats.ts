// Genres are stored as a CSV per game; this counts them across the given rows.
export function topGenres(
  rows: Array<string | null>,
  limit = 8,
): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row) continue;
    for (const part of row.split(",")) {
      const tag = part.trim().toLowerCase();
      if (!tag) continue;
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit);
}
