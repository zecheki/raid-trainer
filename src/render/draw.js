export function drawCircle(ctx, x, y, radius, options = {}) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  if (options.fill) {
    ctx.fillStyle = options.fill;
    ctx.fill();
  }
  if (options.stroke) {
    ctx.strokeStyle = options.stroke;
    ctx.lineWidth = options.lineWidth ?? 2;
    ctx.stroke();
  }
  ctx.restore();
}

export function drawRing(ctx, x, y, radius, options = {}) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = options.stroke ?? '#ffffff';
  ctx.lineWidth = options.lineWidth ?? 8;
  ctx.globalAlpha = options.alpha ?? 1;
  ctx.stroke();
  ctx.restore();
}

export function drawText(ctx, text, x, y, options = {}) {
  ctx.save();
  ctx.font = options.font ?? '14px system-ui, sans-serif';
  ctx.fillStyle = options.fill ?? '#e5e7eb';
  ctx.textAlign = options.align ?? 'center';
  ctx.textBaseline = options.baseline ?? 'middle';
  if (options.shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 8;
  }
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function roundedRect(ctx, x, y, width, height, radius, options = {}) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  if (options.fill) {
    ctx.fillStyle = options.fill;
    ctx.fill();
  }
  if (options.stroke) {
    ctx.strokeStyle = options.stroke;
    ctx.lineWidth = options.lineWidth ?? 1;
    ctx.stroke();
  }
  ctx.restore();
}
