import { useEffect, useRef } from "react";

const TAU = Math.PI * 2;

export function useOrbitCanvas(devices, anomalyActive) {
  const canvasRef = useRef(null);
  const stateRef  = useRef({ tick: 0, angles: [], trails: [], particles: [], pulses: [] });

  useEffect(() => {
    stateRef.current.angles = devices.map(d => d.baseAngle);
    stateRef.current.trails = devices.map(() => []);
  }, [devices.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;

    function resize() {
      const dpr  = window.devicePixelRatio || 1;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width  = rect.width  + "px";
      canvas.style.height = rect.height + "px";
      ctx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener("resize", resize);

    function orbitR(gap) {
      const W = canvas.parentElement.clientWidth;
      const H = canvas.parentElement.clientHeight;
      return Math.min(W, H) * 0.1 + Math.abs(gap) * Math.min(W, H) * 0.013;
    }

    function project(angle, radius) {
      const cx = canvas.parentElement.clientWidth  / 2;
      const cy = canvas.parentElement.clientHeight / 2;
      return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius * 0.45 };
    }

    function hexToRgb(hex) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `${r},${g},${b}`;
    }

    function drawCore() {
      const cx = canvas.parentElement.clientWidth  / 2;
      const cy = canvas.parentElement.clientHeight / 2;
      [100, 70, 45, 25].forEach((r, i) => {
        const a = [0.03, 0.06, 0.1, 0.18][i];
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(80,128,255,${a * 1.5})`);
        g.addColorStop(1, "rgba(80,128,255,0)");
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU);
        ctx.fillStyle = g; ctx.fill();
      });
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 16);
      core.addColorStop(0, "rgba(160,200,255,0.95)");
      core.addColorStop(0.5, "rgba(80,128,255,0.7)");
      core.addColorStop(1, "rgba(30,50,130,0)");
      ctx.beginPath(); ctx.arc(cx, cy, 16, 0, TAU);
      ctx.fillStyle = core; ctx.fill();
      ctx.font = "700 8px 'Geist Mono',monospace";
      ctx.fillStyle = "rgba(180,210,255,0.6)";
      ctx.textAlign = "center";
      ctx.fillText("SHADOW PROJECTION", cx, cy + 28);
      ctx.fillText("gravitational center", cx, cy + 39);
    }

    function frame() {
      const s   = stateRef.current;
      const W   = canvas.parentElement.clientWidth;
      const H   = canvas.parentElement.clientHeight;
      s.tick++;
      ctx.clearRect(0, 0, W, H);

      devices.forEach((dev, i) => {
        const r    = orbitR(dev.gap);
        const rgb  = hexToRgb(dev.color);
        const isCrit = dev.status === "critical";
        ctx.beginPath();
        ctx.ellipse(W / 2, H / 2, r, r * 0.45, 0, 0, TAU);
        ctx.strokeStyle = `rgba(${rgb},${isCrit ? 0.25 : 0.1})`;
        ctx.lineWidth = 0.8; ctx.stroke();
      });

      s.pulses = s.pulses.filter(p => {
        p.r += 2.5; p.life -= 0.02;
        if (p.life <= 0) return false;
        const rgb = hexToRgb(p.color);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.strokeStyle = `rgba(${rgb},${p.life * 0.4})`;
        ctx.lineWidth = 1.5; ctx.stroke();
        return true;
      });

      drawCore();

      devices.forEach((dev, i) => {
        let speed = dev.speed;
        if (anomalyActive && dev.status === "critical") speed *= 0.5;
        s.angles[i] = ((s.angles[i] || dev.baseAngle) + speed) % TAU;

        const eccent = anomalyActive && dev.status === "critical" ? 0.35 : 0;
        const r      = orbitR(dev.gap) * (1 + eccent * Math.cos(s.angles[i]));
        const pos    = project(s.angles[i], r);
        const rgb    = hexToRgb(dev.color);
        const rgb2   = hexToRgb(dev.color2);

        s.trails[i] = s.trails[i] || [];
        s.trails[i].push({ x: pos.x, y: pos.y });
        if (s.trails[i].length > 70) s.trails[i].shift();

        s.trails[i].forEach((pt, ti) => {
          if (ti === 0) return;
          const t = ti / s.trails[i].length;
          ctx.beginPath();
          ctx.moveTo(s.trails[i][ti - 1].x, s.trails[i][ti - 1].y);
          ctx.lineTo(pt.x, pt.y);
          ctx.strokeStyle = `rgba(${rgb},${t * 0.45})`;
          ctx.lineWidth   = 1 + t * 1.5;
          ctx.lineCap = "round"; ctx.stroke();
        });

        if (anomalyActive && dev.status === "critical" && s.tick % 10 === 0) {
          for (let k = 0; k < 3; k++) {
            s.particles.push({
              x: pos.x, y: pos.y,
              vx: (Math.random() - 0.5) * 2.5,
              vy: -(Math.random() * 1.8 + 0.5),
              life: 1, decay: 0.018 + Math.random() * 0.015,
              r: 2 + Math.random() * 3, rgb,
            });
          }
          if (s.tick % 80 === 0) {
            s.pulses.push({ x: pos.x, y: pos.y, r: 0, life: 1, color: dev.color });
          }
        }

        const grd = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 12);
        grd.addColorStop(0, `rgba(${rgb},0.85)`);
        grd.addColorStop(1, `rgba(${rgb},0)`);
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 12, 0, TAU);
        ctx.fillStyle = grd; ctx.fill();
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 5, 0, TAU);
        ctx.fillStyle = `rgb(${rgb2})`; ctx.fill();

        if (dev.status === "critical" && s.tick % 30 < 15) {
          ctx.beginPath(); ctx.arc(pos.x, pos.y, 8 + Math.sin(s.tick * 0.15) * 3, 0, TAU);
          ctx.strokeStyle = `rgba(${rgb},0.6)`; ctx.lineWidth = 1.5; ctx.stroke();
        }

        ctx.font = "600 9px 'Geist Mono',monospace";
        ctx.fillStyle = `rgb(${rgb2})`;
        ctx.textAlign = "center";
        ctx.fillText(dev.name, pos.x, pos.y - 17);
      });

      s.particles = s.particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.life -= p.decay;
        if (p.life <= 0) return false;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, TAU);
        ctx.fillStyle = `rgba(${p.rgb},${p.life * 0.7})`; ctx.fill();
        return true;
      });

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [devices, anomalyActive]);

  return canvasRef;
}
