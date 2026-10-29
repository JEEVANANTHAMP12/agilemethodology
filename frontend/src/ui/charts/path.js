export function buildSplinePath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
}

export function buildAreaPath(points, baselineY) {
  if (!points || points.length === 0) return '';
  const line = buildSplinePath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

export function buildBandPath(upperPoints, lowerPoints) {
  if (!upperPoints?.length || !lowerPoints?.length) return '';
  const upper = buildSplinePath(upperPoints);
  const reversed = [...lowerPoints].reverse();
  const lower = buildSplinePath(reversed).replace(/^M/, 'L');
  return `${upper} ${lower} Z`;
}

export function niceTicks(min, max, count = 5) {
  const span = max - min;
  if (span <= 0) return [min];
  const step = span / count;
  return Array.from({ length: count + 1 }, (_, index) => Math.round((min + step * index) * 100) / 100);
}
