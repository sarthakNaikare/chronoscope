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
      const base   = Math.min(W, H) * 0.12;
      const scaled = Math.abs(gap) * Math.min(W, H) * 0.012;
      return Math.min(base + scaled, Math.min(W, H) * 0.40);
    }

    function cx() { return canvas.parentElement.clientWidth  / 2; }
    function cy() { return canvas.parentElement.clientHeight / 2; }

    function project(angle, radius) {
      return {
        x: cx() + Math.cos(angle) * radius,
        y: cy() + Math.sin(angle) * radius * 0.45,
      };
    }

    function hexToRgb(hex) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `${r},${g},${b}`;
    }

    function drawCore() {
      const x = cx();
      const y = cy();
      [100, 70, 45, 25].forEach((r, i) => {
        const a = [0.03, 0.06, 0.1, 0.18][i];
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(80,128,255,${a * 1.5})`);
        g.addColorStop(1, "rgba(80,128,255,0)");
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fillStyle = g;
        ctx.fill();
      });
      const core = ctx.createRadialGradient(x, y, 0, x, y, 16);
      core.addColorStop(0, "rgba(160,200,255,0.95)");
      core.addColorStop(0.5, "rgba(80,128,255,0.7)");
      core.addColorStop(1, "rgba(30,50,130,0)");
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, TAU);
      ctx.fillStyle = core;
      ctx.fill();
      ctx.font = "700 8px 'Geist Mono',monospace";
      ctx.fillStyle = "rgba(180,210,255,0.6)";
      ctx.textAlign = "center";
      ctx.fillText("SHADOW PROJECTION", x, y + 28);
      ctx.fillText("gravitational center", x, y + 39);
    }

    function frame() {
      const s = stateRef.current;
      const W = canvas.parentElement.clientWidth;
      const H = canvas.parentElement.clientHeight;
      s.tick++;
      ctx.clearRect(0, 0, W, H);

      // draw orbit rings
      devices.forEach((dev, i) => {
        const r   = orbitR(dev.gap);
        const rgb = hexToRgb(dev.color);
        ctx.beginPath();
        ctx.ellipse(cx(), cy(), r, r * 0.45, 0, 0, TAU);
        ctx.strokeStyle = `rgba(${rgb},${dev.status === "critical" ? 0.3 : 0.12})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // pulse rings
      s.pulses = s.pulses.filter(p => {
        p.r += 2.5;
        p.life -= 0.02;
        if (p.life <= 0) return false;
        const rgb = hexToRgb(p.color);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.strokeStyle = `rgba(${rgb},${p.life * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        return true;
      });

      drawCore();

      // draw each device
      devices.forEach((dev, i) => {
        if (!s.angles[i] && s.angles[i] !== 0) s.angles[i] = dev.baseAngle;
        if (!s.trails[i]) s.trails[i] = [];

        const speed = (anomalyActive && dev.status === "critical") ? dev.speed * 0.5 : dev.speed;
        s.angles[i] = (s.angles[i] + speed) % TAU;

        const eccent = (anomalyActive && dev.status === "critical") ? 0.3 : 0;
        const r      = orbitR(dev.gap) * (1 + eccent * Math.cos(s.angles[i]));
        const pos    = project(s.angles[i], r);
        const rgb    = hexToRgb(dev.color);
        const rgb2   = hexToRgb(dev.color2);

        // memory trail
        s.trails[i].push({ x: pos.x, y: pos.y });
        if (s.trails[i].length > 70) s.trails[i].shift();

        for (let ti = 1; ti < s.trails[i].length; ti++) {
          const t = ti / s.trails[i].length;
          ctx.beginPath();
          ctx.moveTo(s.trails[i][ti - 1].x, s.trails[i][ti - 1].y);
          ctx.lineTo(s.trails[i][ti].x, s.trails[i][ti].y);
          ctx.strokeStyle = `rgba(${rgb},${t * 0.65})`;
          ctx.lineWidth   = 1.5 + t * 2.5;
          ctx.lineCap = "round";
          ctx.stroke();
        }

        // particles on anomaly
        if (anomalyActive && dev.status === "critical" && s.tick % 10 === 0) {
          for (let k = 0; k < 3; k++) {
            s.particles.push({
              x: pos.x, y: pos.y,
              vx: (Math.random() - 0.5) * 2.5,
              vy: -(Math.random() * 1.8 + 0.5),
              life: 1,
              decay: 0.018 + Math.random() * 0.015,
              r: 2 + Math.random() * 3,
              rgb,
            });
          }
          if (s.tick % 80 === 0) {
            s.pulses.push({ x: pos.x, y: pos.y, r: 0, life: 1, color: dev.color });
          }
        }

        // glow
        const grd = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 14);
        grd.addColorStop(0, `rgba(${rgb},0.9)`);
        grd.addColorStop(1, `rgba(${rgb},0)`);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 14, 0, TAU);
        ctx.fillStyle = grd;
        ctx.fill();

        // core dot
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 7, 0, TAU);
        ctx.fillStyle = `rgb(${rgb2})`;
        ctx.fill();

        // pulsing ring for critical
        if (dev.status === "critical" && s.tick % 30 < 15) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 11 + Math.sin(s.tick * 0.15) * 3, 0, TAU);
          ctx.strokeStyle = `rgba(${rgb},0.6)`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // name label — white text with colored underlay for contrast
        ctx.textAlign = "center";
        ctx.font = "700 11px 'Geist Mono',monospace";
        ctx.fillStyle = `rgba(${rgb},0.5)`;
        ctx.fillText(dev.name, pos.x + 1, pos.y - 19);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(dev.name, pos.x, pos.y - 20);
      });

      // floating particles
      s.particles = s.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.life -= p.decay;
        if (p.life <= 0) return false;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life, 0, TAU);
        ctx.fillStyle = `rgba(${p.rgb},${p.life * 0.7})`;
        ctx.fill();
        return true;
      });

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [devices, anomalyActive]);

  return canvasRef;
}
