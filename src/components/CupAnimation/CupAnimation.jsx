import React, { useRef, useEffect, useCallback, useState } from 'react';
import { INGREDIENT_VISUALS } from './ingredientVisuals';
import { findMatchingRecipe } from './recipeVideos';
import './CupAnimation.css';

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, v) { return a + (b - a) * v; }
function easeInOut(v) { return v < 0.5 ? 2 * v * v : -1 + (4 - 2 * v) * v; }

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

function rgbStr(c, alpha = 1) {
  return `rgba(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${alpha})`;
}

function shadeColor(hex, amt) {
  let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  r = clamp(r + amt, 0, 255); g = clamp(g + amt, 0, 255); b = clamp(b + amt, 0, 255);
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

const DURATION = 5000;
const ANIM_STEPS = [
  { label: 'Pouring base concentrate...' },
  { label: 'Adding milk...' },
  { label: 'Drizzling sweetener...' },
  { label: 'Settling layers...' },
  { label: 'Finishing touches...' },
  { label: 'Ready! ☕' },
];

const CupAnimation = ({
  selections = {},
  size = 280,
  autoPlay = true,
  onRecordComplete = null,
  recordingEnabled = false,
  className = '',
}) => {
  const canvasRef = useRef(null);
  const animRef = useRef({
    t: 0, lastTs: null, looping: false, pourParticles: [],
    waveTime: 0, stableT: 0, stableLastTs: null,
    animPhase: 0, // 0=base, 1=milk, 2=sweetener, 3=settle, 4=toppings, 5=done
  });
  const [isRecording, setIsRecording] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const selectionsRef = useRef(selections);
  const videoRef = useRef(null);

  useEffect(() => { selectionsRef.current = selections; }, [selections]);

  const matchedRecipe = findMatchingRecipe(selections);
  const hasVideo = matchedRecipe?.video && !videoError;

  const getIngredientColors = useCallback((sel) => {
    const baseVis = INGREDIENT_VISUALS.concentrates[sel.base?.id] || INGREDIENT_VISUALS.concentrates['50-50'];
    const milkVis = sel.milk?.id && INGREDIENT_VISUALS.milks[sel.milk.id] ? INGREDIENT_VISUALS.milks[sel.milk.id] : null;
    const sweetVis = sel.sweetener?.id && INGREDIENT_VISUALS.sweeteners[sel.sweetener.id] ? INGREDIENT_VISUALS.sweeteners[sel.sweetener.id] : null;
    const toppingIds = (sel.toppings || []).map(t => t.id);
    const toppings = toppingIds.map(id => INGREDIENT_VISUALS.toppings[id]).filter(Boolean);
    const hasFoam = toppingIds.includes('whipped_cream');
    const hasIce = toppingIds.includes('ice');
    const drizzles = toppings.filter(t => t?.type === 'drizzle');
    const powders = toppings.filter(t => t?.type === 'powder');
    const sprinkles = toppings.filter(t => t?.type === 'sprinkle');
    return { baseVis, milkVis, sweetVis, toppings, hasFoam, hasIce, drizzles, powders, sprinkles };
  }, []);

  const draw = useCallback((ctx, W, H) => {
    const anim = animRef.current;
    const sel = selectionsRef.current;
    const { baseVis, milkVis, sweetVis, hasFoam, hasIce, drizzles, powders, sprinkles } = getIngredientColors(sel);

    const CX = W / 2;
    const CUP_W_TOP = W * 0.44;
    const CUP_W_BOT = W * 0.32;
    const CUP_H = H * 0.65;
    const CUP_Y = H * 0.22;

    function cupLeft(y) {
      const t = (y - CUP_Y) / CUP_H;
      return CX - (CUP_W_TOP / 2 - (CUP_W_TOP - CUP_W_BOT) / 2 * t);
    }
    function cupRight(y) {
      const t = (y - CUP_Y) / CUP_H;
      return CX + (CUP_W_TOP / 2 - (CUP_W_TOP - CUP_W_BOT) / 2 * t);
    }

    function liquidTop(fillFraction) {
      return CUP_Y + CUP_H - fillFraction * CUP_H;
    }

    function clipToCup() {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(CX - CUP_W_TOP / 2 + 2, CUP_Y + 1);
      ctx.lineTo(CX - CUP_W_BOT / 2 + 1, CUP_Y + CUP_H - 1);
      ctx.lineTo(CX + CUP_W_BOT / 2 - 1, CUP_Y + CUP_H - 1);
      ctx.lineTo(CX + CUP_W_TOP / 2 - 2, CUP_Y + 1);
      ctx.closePath();
      ctx.clip();
    }

    function drawLiquidLayer(yTop, yBot, color1, color2, alpha) {
      if (yTop >= yBot) return;
      const leftTop = cupLeft(yTop), rightTop = cupRight(yTop);
      const leftBot = cupLeft(yBot), rightBot = cupRight(yBot);
      const grad = ctx.createLinearGradient(leftTop, 0, rightTop, 0);
      grad.addColorStop(0, shadeColor(color1, -20));
      grad.addColorStop(0.3, color1);
      grad.addColorStop(0.7, color2 || color1);
      grad.addColorStop(1, shadeColor(color1, -20));
      ctx.beginPath();
      ctx.moveTo(leftTop, yTop);
      ctx.lineTo(leftBot, yBot);
      ctx.lineTo(rightBot, yBot);
      ctx.lineTo(rightTop, yTop);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.globalAlpha = alpha || 1;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    function drawSurfaceShimmer(y, width, alpha) {
      const lx = cupLeft(y) + 4, rx = cupRight(y) - 4;
      ctx.save();
      ctx.globalAlpha = alpha * 0.5;
      ctx.beginPath();
      ctx.moveTo(lx, y);
      for (let x = lx; x <= rx; x += 2) {
        const wave = Math.sin(x * 0.1 + anim.waveTime) * 2;
        ctx.lineTo(x, y + wave);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    function drawCupOutline() {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;

      ctx.beginPath();
      ctx.moveTo(CX - CUP_W_TOP / 2, CUP_Y);
      ctx.lineTo(CX - CUP_W_BOT / 2, CUP_Y + CUP_H);
      ctx.lineTo(CX + CUP_W_BOT / 2, CUP_Y + CUP_H);
      ctx.lineTo(CX + CUP_W_TOP / 2, CUP_Y);
      ctx.closePath();
      const glassGrad = ctx.createLinearGradient(CX - CUP_W_TOP / 2, 0, CX + CUP_W_TOP / 2, 0);
      glassGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
      glassGrad.addColorStop(0.3, 'rgba(255,255,255,0.02)');
      glassGrad.addColorStop(0.7, 'rgba(255,255,255,0.02)');
      glassGrad.addColorStop(1, 'rgba(255,255,255,0.06)');
      ctx.fillStyle = glassGrad;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = 'rgba(200,200,200,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const handleR = CUP_W_BOT * 0.22;
      const handleCX = CX + CUP_W_BOT / 2 + handleR + 4;
      const handleCY = CUP_Y + CUP_H * 0.55;
      ctx.beginPath();
      ctx.arc(handleCX, handleCY, handleR, -1.2, 1.2);
      ctx.strokeStyle = 'rgba(200,200,200,0.3)';
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(handleCX, handleCY, handleR, -1.2, 1.2);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(CX - CUP_W_TOP / 2 + 4, CUP_Y + 5);
      ctx.lineTo(CX + CUP_W_TOP / 2 - 4, CUP_Y + 5);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    }

    function drawSaucer() {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(CX, CUP_Y + CUP_H + 8, CUP_W_BOT * 0.7 + 8, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#e8ddd0';
      ctx.fill();
      ctx.strokeStyle = '#d0c0a8';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    function drawStream(x, fromY, toY, color, width, alpha) {
      ctx.save();
      ctx.globalAlpha = clamp(alpha || 1, 0, 1);
      const sg = ctx.createLinearGradient(x - width / 2, 0, x + width / 2, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0.1)');
      sg.addColorStop(0.5, color);
      sg.addColorStop(1, 'rgba(0,0,0,0.2)');
      ctx.beginPath();
      ctx.moveTo(x - width / 2, fromY);
      ctx.bezierCurveTo(x - width / 2 + 1, (fromY + toY) / 2, x - width / 2 - 1, (fromY + toY) / 2, x - width / 2, toY);
      ctx.lineTo(x + width / 2, toY);
      ctx.bezierCurveTo(x + width / 2 - 1, (fromY + toY) / 2, x + width / 2 + 1, (fromY + toY) / 2, x + width / 2, fromY);
      ctx.closePath();
      ctx.fillStyle = sg;
      ctx.fill();
      ctx.restore();
    }

    function drawFoam(yTop) {
      if (!milkVis?.foam) return;
      ctx.save();
      const lx = cupLeft(yTop), rx = cupRight(yTop);
      const mid = (lx + rx) / 2, w = rx - lx;
      const foamGrad = ctx.createLinearGradient(lx, 0, rx, 0);
      foamGrad.addColorStop(0, 'rgba(245,235,215,0.5)');
      foamGrad.addColorStop(0.5, 'rgba(255,248,238,0.9)');
      foamGrad.addColorStop(1, 'rgba(245,235,215,0.5)');
      ctx.beginPath();
      ctx.ellipse(mid, yTop + 2, w / 2 - 2, 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = foamGrad;
      ctx.fill();
      const bubbles = [
        [mid - w * 0.2, yTop + 1, 4], [mid, yTop - 2, 5],
        [mid + w * 0.2, yTop + 0, 3.5], [mid - w * 0.08, yTop + 3, 2.5],
        [mid + w * 0.08, yTop + 2.5, 2.5],
      ];
      bubbles.forEach(([bx, by, br]) => {
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,250,242,0.3)';
        ctx.fill();
      });
      ctx.restore();
    }

    function drawDrizzle(yTop, color, alpha) {
      ctx.save();
      ctx.globalAlpha = clamp(alpha || 1, 0, 1);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      const tw = cupRight(yTop + 10) - cupLeft(yTop + 10);
      const tx = cupLeft(yTop + 10);
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const ox = tx + tw * 0.15 + i * (tw * 0.28);
        ctx.moveTo(ox, yTop - 15);
        ctx.bezierCurveTo(ox + 8, yTop + 5, ox - 8, yTop + 15, ox + 3, yTop + 28);
      }
      ctx.stroke();
      ctx.restore();
    }

    function drawPowder(yTop, color, alpha) {
      ctx.save();
      ctx.globalAlpha = clamp(alpha || 1, 0, 1) * 0.6;
      const lx = cupLeft(yTop) + 6, rx = cupRight(yTop) - 6;
      for (let i = 0; i < 25; i++) {
        const px = lx + Math.random() * (rx - lx);
        const py = yTop - 4 + Math.random() * (CUP_H * 0.1);
        const pr = 1 + Math.random() * 2;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
      ctx.restore();
    }

    function drawSprinkles(yTop, color, alpha) {
      ctx.save();
      ctx.globalAlpha = clamp(alpha || 1, 0, 1) * 0.7;
      const lx = cupLeft(yTop) + 8, rx = cupRight(yTop) - 8;
      for (let i = 0; i < 12; i++) {
        const px = lx + Math.random() * (rx - lx);
        const py = yTop - 6 + Math.random() * (CUP_H * 0.06);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.random() * Math.PI);
        ctx.fillStyle = ['#ff6688', '#66ccff', '#ffdd44', '#88ff66', '#ff88cc'][i % 5];
        ctx.fillRect(-3, -1.5, 6, 3);
        ctx.restore();
      }
      ctx.restore();
    }

    function drawIce(yTop) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      const lx = cupLeft(yTop) + 10, rx = cupRight(yTop) - 10;
      for (let i = 0; i < 3; i++) {
        const ix = lx + (rx - lx) * (0.2 + i * 0.3);
        const iy = yTop + 10 + Math.sin(i * 2 + anim.waveTime * 0.5) * 4;
        const is = 6 + Math.sin(i + anim.waveTime * 0.3) * 2;
        ctx.save();
        ctx.translate(ix, iy);
        ctx.rotate(Math.sin(i + anim.waveTime * 0.2) * 0.1);
        ctx.fillStyle = 'rgba(200,220,240,0.5)';
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(-is, -is * 0.6, is * 2, is * 1.2, 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }

    function emitPour(color, tx, count) {
      for (let i = 0; i < count; i++) {
        anim.pourParticles.push({
          x: tx + (Math.random() - 0.5) * 6,
          y: CUP_Y - 40 - Math.random() * 15,
          vy: 2.5 + Math.random() * 2,
          vx: (Math.random() - 0.5) * 0.4,
          r: 1.5 + Math.random() * 3,
          color, alpha: 0.9,
        });
      }
    }

    function updateParticles(fillY) {
      anim.pourParticles = anim.pourParticles.filter(p => {
        p.y += p.vy; p.x += p.vx; p.vy += 0.25;
        if (p.y > fillY + 5) p.alpha -= 0.12;
        return p.alpha > 0;
      });
    }

    function drawParticles() {
      anim.pourParticles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
      });
    }

    ctx.clearRect(0, 0, W, H);

    const p = clamp(anim.t / DURATION, 0, 1);

    const baseFillEnd = 0.22;
    const milkFillEnd = 0.48;
    const sweetFillEnd = 0.62;
    const settleEnd = 0.76;
    const toppingEnd = 0.92;

    const baseFill = clamp((p - 0) / baseFillEnd, 0, 1);
    const milkFill = milkVis ? clamp((p - baseFillEnd) / (milkFillEnd - baseFillEnd), 0, 1) : 0;
    const sweetFill = sweetVis ? clamp((p - milkFillEnd) / (sweetFillEnd - milkFillEnd), 0, 1) : 0;
    const settlePhase = clamp((p - sweetFillEnd) / (settleEnd - sweetFillEnd), 0, 1);
    const toppingPhase = clamp((p - settleEnd) / (toppingEnd - settleEnd), 0, 1);
    const donePhase = clamp((p - toppingEnd) / (1 - toppingEnd), 0, 1);

    const baseLayerFrac = 0.45 * easeInOut(baseFill);
    const milkLayerFrac = milkVis ? 0.25 * easeInOut(milkFill) : 0;
    const sweetLayerFrac = sweetVis ? 0.06 * easeInOut(sweetFill) : 0;
    const totalFrac = baseLayerFrac + milkLayerFrac + sweetLayerFrac;
    const fillTop = liquidTop(totalFrac);

    const baseRgb = hexToRgb(baseVis.color);
    const milkRgb = milkVis ? hexToRgb(milkVis.color) : null;
    const sweetRgb = sweetVis ? hexToRgb(sweetVis.color) : null;

    let animPhase;
    if (p < baseFillEnd) animPhase = 0;
    else if (p < milkFillEnd) animPhase = 1;
    else if (p < sweetFillEnd) animPhase = 2;
    else if (p < settleEnd) animPhase = 3;
    else if (p < toppingEnd) animPhase = 4;
    else animPhase = 5;

    const stepLabel = ANIM_STEPS[animPhase]?.label || '';

    drawSaucer();

    ctx.save();
    clipToCup();

    if (baseLayerFrac > 0.01) {
      const bBot = CUP_Y + CUP_H;
      const bTop = liquidTop(baseLayerFrac);
      drawLiquidLayer(bTop, bBot, baseVis.color, baseVis.dark, baseVis.opacity);
      drawSurfaceShimmer(bTop, CUP_W_TOP * 0.8, baseFill);
    }
    if (milkLayerFrac > 0.01 && milkVis) {
      const mBot = liquidTop(baseLayerFrac);
      const mTop = liquidTop(baseLayerFrac + milkLayerFrac);
      drawLiquidLayer(mTop, mBot, milkVis.color, milkVis.dark, milkVis.opacity);
      drawSurfaceShimmer(mTop, CUP_W_TOP * 0.8, milkFill);
    }
    if (sweetLayerFrac > 0.01 && sweetVis) {
      const sBot = liquidTop(baseLayerFrac + milkLayerFrac);
      const sTop = liquidTop(baseLayerFrac + milkLayerFrac + sweetLayerFrac);
      if (sweetVis.isSyrup) {
        drawLiquidLayer(sTop, sBot, sweetVis.color, sweetVis.dark, sweetVis.opacity);
      }
    }

    ctx.restore();

    if (hasFoam && totalFrac > 0.05 && p > sweetFillEnd) {
      drawFoam(fillTop);
    }

    if (hasIce && totalFrac > 0.05 && p > sweetFillEnd) {
      drawIce(fillTop);
    }

    if (drizzles.length > 0 && p > settleEnd) {
      drizzles.forEach((d, i) => {
        const dAlpha = clamp((toppingPhase - i * 0.1) * 2, 0, 1);
        drawDrizzle(fillTop, d.color, dAlpha * d.opacity);
      });
    }

    if (powders.length > 0 && p > settleEnd) {
      powders.forEach((d, i) => {
        const dAlpha = clamp((toppingPhase - i * 0.08) * 2, 0, 1);
        drawPowder(fillTop, d.color, dAlpha * d.opacity);
      });
    }

    if (sprinkles.length > 0 && p > settleEnd) {
      sprinkles.forEach((d, i) => {
        const dAlpha = clamp((toppingPhase - i * 0.08) * 2, 0, 1);
        drawSprinkles(fillTop, d.color, dAlpha * d.opacity);
      });
    }

    drawCupOutline();

    if (p > 0 && p < baseFillEnd) {
      const sp = p / baseFillEnd;
      const streamAlpha = sp < 0.9 ? 1 : (1 - sp) / 0.1;
      drawStream(CX - 8, CUP_Y - 50, fillTop, baseVis.color, 6, streamAlpha);
      if (Math.random() < 0.5) emitPour(baseVis.color, CX - 8, 2);
    }
    if (p >= baseFillEnd && p < milkFillEnd && milkVis) {
      const sp = (p - baseFillEnd) / (milkFillEnd - baseFillEnd);
      const streamAlpha = sp < 0.9 ? 1 : (1 - sp) / 0.1;
      drawStream(CX + 12, CUP_Y - 50, fillTop, milkVis.color, 5, streamAlpha);
      if (Math.random() < 0.5) emitPour(milkVis.color, CX + 12, 2);
    }
    if (p >= milkFillEnd && p < sweetFillEnd && sweetVis?.isSyrup) {
      const sp = (p - milkFillEnd) / (sweetFillEnd - milkFillEnd);
      const streamAlpha = sp < 0.85 ? 1 : (1 - sp) / 0.15;
      drawStream(CX, CUP_Y - 55, fillTop, sweetVis.color, 3.5, streamAlpha);
      if (Math.random() < 0.4) emitPour(sweetVis.color, CX, 1);
    }

    updateParticles(fillTop + 5);
    drawParticles();

    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.beginPath();
    ctx.moveTo(CX - CUP_W_TOP / 2 + 8, CUP_Y + 10);
    ctx.lineTo(CX - CUP_W_BOT / 2 + 6, CUP_Y + CUP_H - 10);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#fff';
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = p < 0.95 ? 0.7 : clamp((1 - p) * 20, 0, 0.7);
    ctx.font = `${Math.round(W * 0.028)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#999';
    ctx.fillText(stepLabel, CX, H - 8);
    ctx.restore();

    if (p >= 0.95) {
      ctx.save();
      const fa = clamp((p - 0.95) / 0.05, 0, 1);
      ctx.globalAlpha = fa;
      ctx.font = `600 ${Math.round(W * 0.035)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#c8955c';
      ctx.fillText('My Custom Brew', CX, CUP_Y - 35);

      ctx.font = `500 ${Math.round(W * 0.028)}px system-ui, sans-serif`;
      ctx.fillStyle = '#888';
      ctx.fillText(`₹${sel.totalPrice || 0}`, CX, CUP_Y - 12);
      ctx.restore();
    }

    anim.waveTime += 0.04;
  }, [getIngredientColors]);

  const startAnimation = useCallback(() => {
    const anim = animRef.current;
    anim.t = 0;
    anim.lastTs = null;
    anim.pourParticles = [];
    anim.waveTime = 0;
    anim.looping = true;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width / (window.devicePixelRatio || 1);
    const H = canvas.height / (window.devicePixelRatio || 1);

    function loop(ts) {
      if (!anim.looping) return;
      if (!anim.lastTs) anim.lastTs = ts;
      const dt = ts - anim.lastTs;
      anim.lastTs = ts;
      anim.t += dt;
      draw(ctx, W, H);
      if (anim.t < DURATION) {
        requestAnimationFrame(loop);
      }
    }
    requestAnimationFrame(loop);
  }, [draw]);

  const startRecording = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const stream = canvas.captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const recorder = new MediaRecorder(stream, { mimeType });
    recordedChunksRef.current = [];
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      setIsRecording(false);
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      if (onRecordComplete) {
        onRecordComplete(blob);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `custom-coffee-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      }
    };

    recorder.start();
    setIsRecording(true);
    startAnimation();

    const totalDuration = DURATION + 500;
    setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop();
    }, totalDuration);
  }, [startAnimation, onRecordComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    if (autoPlay) {
      startAnimation();
    }
  }, [size, autoPlay, startAnimation, selections]);

  return (
    <div className={`cup-animation-wrap ${className}`}>
      <div className="cup-animation-inner">
        {hasVideo ? (
          <video
            ref={videoRef}
            src={matchedRecipe.video}
            poster={matchedRecipe.thumbnail || undefined}
            width={size}
            height={size}
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoError(true)}
            style={{
              width: size,
              height: size,
              borderRadius: 16,
              objectFit: 'cover',
            }}
          />
        ) : (
          <canvas
            ref={canvasRef}
            style={{ width: size, height: size }}
          />
        )}
        {!hasVideo && recordingEnabled && (
          <button
            className={`cup-record-btn ${isRecording ? 'recording' : ''}`}
            onClick={startRecording}
            disabled={isRecording}
          >
            {isRecording ? 'Recording...' : 'Record Video'}
          </button>
        )}
        {hasVideo && (
          <div className="cup-video-badge">Signature Recipe</div>
        )}
      </div>
    </div>
  );
};

export default CupAnimation;
