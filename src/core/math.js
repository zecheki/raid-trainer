export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function randomInt(minInclusive, maxExclusive) {
  return Math.floor(Math.random() * (maxExclusive - minInclusive)) + minInclusive;
}

export function randomItem(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return undefined;
  }
  return items[randomInt(0, items.length)];
}

export function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function radiansToDegrees(radians) {
  return (radians * 180) / Math.PI;
}

export function laneAngle(laneIndex, laneCount = 12, angleGaps = null) {
  if (Array.isArray(angleGaps) && angleGaps.length > 0) {
    let angle = 0;

    for (let i = 0; i < laneIndex; i += 1) {
      angle += angleGaps[i % angleGaps.length];
    }

    return angle % 360;
  }

  return laneIndex * (360 / laneCount);
}

export function angleToPoint(cx, cy, angleDegrees, distance) {
  const radians = degreesToRadians(angleDegrees);
  return {
    x: cx + Math.cos(radians) * distance,
    y: cy + Math.sin(radians) * distance,
  };
}

export function normalize(x, y) {
  const length = Math.hypot(x, y);
  if (length <= 0.00001) {
    return { x: 0, y: 0, length: 0 };
  }
  return { x: x / length, y: y / length, length };
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function angleBetweenPoints(from, to) {
  return radiansToDegrees(Math.atan2(to.y - from.y, to.x - from.x));
}

export function lineHitCircle(lineStart, lineEnd, circleCenter, circleRadius) {
  const ax = lineStart.x;
  const ay = lineStart.y;
  const bx = lineEnd.x;
  const by = lineEnd.y;
  const cx = circleCenter.x;
  const cy = circleCenter.y;

  const abx = bx - ax;
  const aby = by - ay;
  const acx = cx - ax;
  const acy = cy - ay;
  const abLengthSq = abx * abx + aby * aby;

  if (abLengthSq <= 0.00001) {
    return Math.hypot(cx - ax, cy - ay) <= circleRadius;
  }

  const t = clamp((acx * abx + acy * aby) / abLengthSq, 0, 1);
  const closestX = ax + abx * t;
  const closestY = ay + aby * t;

  return Math.hypot(cx - closestX, cy - closestY) <= circleRadius;
}
