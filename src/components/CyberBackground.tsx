import React, { useEffect, useRef, useState } from 'react';

export default function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLightMode, setIsLightMode] = useState(() => document.documentElement.classList.contains('light'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLightMode(document.documentElement.classList.contains('light'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // High density grid layout
    const cellW = 38;
    const cellH = 24;

    let cols = Math.ceil(width / cellW) + 1;
    let rows = Math.ceil(height / cellH) + 1;

    interface Cell {
      val: string;
      baseOpacity: number;
      opacity: number;
      targetOpacity: number;
      pulseSpeed: number;
      pulseOffset: number;
      lastChange: number;
    }

    let cells: Cell[] = [];

    const hexChars = '0123456789ABCDEF';
    const getRandomHex = () => {
      // Sometimes return single characters or numbers to match standard technical reference
      const roll = Math.random();
      if (roll < 0.15) {
        return hexChars[Math.floor(Math.random() * 16)];
      } else if (roll < 0.3) {
        return Math.floor(Math.random() * 100).toString();
      }
      return hexChars[Math.floor(Math.random() * 16)] + hexChars[Math.floor(Math.random() * 16)];
    };

    const initCells = (cCount: number, rCount: number) => {
      cells = [];
      const total = cCount * rCount;
      const now = Date.now();
      for (let i = 0; i < total; i++) {
        // High depth density opacity variants
        const depthRoll = Math.random();
        let baseOp = 0.03;
        if (depthRoll < 0.1) baseOp = 0.16; // highlight layer
        else if (depthRoll < 0.3) baseOp = 0.08; // middle depth
        else if (depthRoll < 0.7) baseOp = 0.04; // far depth
        else baseOp = 0.015; // deep background noise

        cells.push({
          val: getRandomHex(),
          baseOpacity: baseOp,
          opacity: baseOp,
          targetOpacity: baseOp,
          pulseSpeed: 0.002 + Math.random() * 0.008,
          pulseOffset: Math.random() * Math.PI * 2,
          lastChange: now + Math.random() * 5000,
        });
      }
    };

    initCells(cols, rows);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      cols = Math.ceil(width / cellW) + 1;
      rows = Math.ceil(height / cellH) + 1;
      initCells(cols, rows);
    };
    window.addEventListener('resize', handleResize);

    let sweepY = 0;
    let radarRotation = 0;
    const centerLock = { x: width / 2, y: height / 2 };

    const render = () => {
      // Pure deep cyberpunk obsidian space
      const isL = document.documentElement.classList.contains('light');
      ctx.fillStyle = isL ? '#f8fafc' : '#03050a';
      ctx.fillRect(0, 0, width, height);

      const now = Date.now();
      const centerX = width / 2;
      const centerY = height / 2;

      // Update center coordinate in case screen elements shift
      centerLock.x = centerX;
      centerLock.y = centerY;

      // 1. Subtle blueprints grid lines
      ctx.strokeStyle = isL ? 'rgba(164, 209, 0, 0.08)' : 'rgba(204, 255, 0, 0.018)';
      ctx.lineWidth = 0.5;
      
      // Vertical grid paths
      for (let x = 0; x < width; x += 76) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      // Horizontal grid paths
      for (let y = 0; y < height; y += 48) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw grid tick crosshairs (+) at some intersections to look like a weapon/telemetry system
      ctx.strokeStyle = isL ? 'rgba(164, 209, 0, 0.15)' : 'rgba(204, 255, 0, 0.08)';
      for (let x = 76; x < width - 50; x += 152) {
        for (let y = 48; y < height - 50; y += 96) {
          ctx.beginPath();
          ctx.moveTo(x - 4, y);
          ctx.lineTo(x + 4, y);
          ctx.moveTo(x, y - 4);
          ctx.lineTo(x, y + 4);
          ctx.stroke();
        }
      }

      // 2. High density character matrix render
      ctx.font = 'bold 8.5px "JetBrains Mono", "Fira Code", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const totalCells = cols * rows;

      // Random active micro-pulses (data activity bursts)
      for (let i = 0; i < 5; i++) {
        const idx = Math.floor(Math.random() * totalCells);
        if (cells[idx]) {
          cells[idx].targetOpacity = 0.38; // Bright flash
          cells[idx].val = getRandomHex();
        }
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const cell = cells[idx];
          if (!cell) continue;

          // Process subtle organic sinus breathing
          const pulse = Math.sin(now * cell.pulseSpeed + cell.pulseOffset) * 0.012;
          
          // Smooth interpolation
          if (cell.opacity < cell.targetOpacity) {
            cell.opacity += 0.02;
          } else if (cell.opacity > cell.baseOpacity) {
            cell.opacity -= 0.012; // fade down
          } else {
            cell.opacity = cell.baseOpacity;
            cell.targetOpacity = cell.baseOpacity;
          }

          // Random character mutation timer
          if (now > cell.lastChange) {
            cell.val = getRandomHex();
            cell.lastChange = now + 4000 + Math.random() * 8000;
            if (Math.random() < 0.05) {
              cell.targetOpacity = 0.22; // subtle flash
            }
          }

          const renderOpacity = Math.max(0.005, cell.opacity + pulse);
          const x = c * cellW + cellW / 2;
          const y = r * cellH + cellH / 2;

          // Render color spectrum based on opacity to create premium layered depth
          if (renderOpacity > 0.2) {
            ctx.fillStyle = isL ? `rgba(130, 180, 0, ${renderOpacity * 2})` : `rgba(204, 255, 0, ${renderOpacity})`;
            // Give glowing characters a tiny overlay shadow
            ctx.shadowColor = isL ? 'rgba(130, 180, 0, 0.2)' : 'rgba(204, 255, 0, 0.4)';
            ctx.shadowBlur = isL ? 0 : 2;
          } else if (renderOpacity > 0.07) {
            ctx.fillStyle = isL ? `rgba(100, 140, 0, ${renderOpacity * 2})` : `rgba(180, 230, 0, ${renderOpacity})`;
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = isL ? `rgba(80, 110, 0, ${renderOpacity * 2})` : `rgba(130, 180, 0, ${renderOpacity})`;
            ctx.shadowBlur = 0;
          }

          ctx.fillText(cell.val, x, y);
        }
      }
      ctx.shadowBlur = 0; // reset shadow calculation

      // 3. Sweeping circular radars and intelligence target outlines (Layer 3)
      radarRotation += 0.004;

      // Center geometric hub overlays (highly reflective of the cognitive core in the reference image)
      ctx.strokeStyle = isL ? 'rgba(130, 180, 0, 0.15)' : 'rgba(204, 255, 0, 0.06)';
      ctx.lineWidth = 1;

      // Multiple complex layout rings
      const rings = [100, 180, 280, 360, 480];
      rings.forEach((radius, i) => {
        ctx.beginPath();
        if (i === 1) {
          ctx.setLineDash([10, 15]);
        } else if (i === 2) {
          ctx.setLineDash([4, 18]);
        } else if (i === 3) {
          ctx.setLineDash([20, 10, 5, 10]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.arc(centerLock.x, centerLock.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Precision axis crosshair lines spanning across the screen
      ctx.strokeStyle = isL ? 'rgba(130, 180, 0, 0.1)' : 'rgba(204, 255, 0, 0.035)';
      ctx.beginPath();
      ctx.moveTo(centerLock.x - 550, centerLock.y);
      ctx.lineTo(centerLock.x + 550, centerLock.y);
      ctx.moveTo(centerLock.x, centerLock.y - 550);
      ctx.lineTo(centerLock.x, centerLock.y + 550);
      ctx.stroke();

      // Rotating complex radar telemetry lines
      ctx.save();
      ctx.translate(centerLock.x, centerLock.y);
      ctx.rotate(radarRotation);

      // Main tracking sweeping spoke line and glowing arc
      const radialGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, 360);
      radialGrad.addColorStop(0, isL ? 'rgba(130, 180, 0, 0.25)' : 'rgba(204, 255, 0, 0.12)');
      radialGrad.addColorStop(0.5, isL ? 'rgba(130, 180, 0, 0.1)' : 'rgba(204, 255, 0, 0.04)');
      radialGrad.addColorStop(1, 'rgba(204, 255, 0, 0.00)');

      ctx.fillStyle = radialGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 360, -0.25, 0.25);
      ctx.lineTo(0, 0);
      ctx.fill();

      // Sharp sweeping vector line
      ctx.strokeStyle = isL ? 'rgba(130, 180, 0, 0.5)' : 'rgba(204, 255, 0, 0.28)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(360, 0);
      ctx.stroke();

      // Draw secondary passive lines
      ctx.strokeStyle = isL ? 'rgba(130, 180, 0, 0.15)' : 'rgba(204, 255, 0, 0.06)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-240, 120);
      ctx.stroke();

      ctx.restore();

      // Inner locking core overlay from reference
      ctx.strokeStyle = isL ? 'rgba(130, 180, 0, 0.5)' : 'rgba(204, 255, 0, 0.35)';
      ctx.fillStyle = isL ? 'rgba(248, 250, 252, 0.95)' : 'rgba(3, 5, 10, 0.95)';
      ctx.beginPath();
      ctx.arc(centerLock.x, centerLock.y, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Center lock glowing indicator
      const pulseDotOpacity = 0.35 + Math.sin(now / 180) * 0.25;
      ctx.fillStyle = isL ? `rgba(130, 180, 0, ${pulseDotOpacity})` : `rgba(204, 255, 0, ${pulseDotOpacity})`;
      ctx.beginPath();
      ctx.arc(centerLock.x, centerLock.y, 14, 0, Math.PI * 2);
      ctx.fill();

      // Technical boundary corner frames on desktop screens
      if (width > 768) {
        ctx.strokeStyle = isL ? 'rgba(130, 180, 0, 0.4)' : 'rgba(204, 255, 0, 0.25)';
        ctx.lineWidth = 1.5;
        const cornerSize = 16;
        const pad = 24;

        // Top Left
        ctx.beginPath();
        ctx.moveTo(pad + cornerSize, pad);
        ctx.lineTo(pad, pad);
        ctx.lineTo(pad, pad + cornerSize);
        ctx.stroke();

        // Top Right
        ctx.beginPath();
        ctx.moveTo(width - pad - cornerSize, pad);
        ctx.lineTo(width - pad, pad);
        ctx.lineTo(width - pad, pad + cornerSize);
        ctx.stroke();

        // Bottom Left
        ctx.beginPath();
        ctx.moveTo(pad + cornerSize, height - pad);
        ctx.lineTo(pad, height - pad);
        ctx.lineTo(pad, height - pad + cornerSize);
        ctx.stroke();

        // Bottom Right
        ctx.beginPath();
        ctx.moveTo(width - pad - cornerSize, height - pad);
        ctx.lineTo(width - pad, height - pad);
        ctx.lineTo(width - pad, height - pad + cornerSize);
        ctx.stroke();
      }

      // Micro status labels to perfectly resemble the reference metadata labels
      ctx.fillStyle = isL ? 'rgba(80, 110, 0, 0.6)' : 'rgba(204, 255, 0, 0.45)';
      ctx.font = 'bold 8px "JetBrains Mono", "Fira Code", monospace';
      
      // Left micro telemetry
      ctx.textAlign = 'left';
      ctx.fillText('QUANTUM ENGINE: OPERATIONAL', 45, 55);
      ctx.fillText('CORE FREQUENCY: 14.88 PHz', 45, 70);
      ctx.fillText('SECURE NODE ID: #TWR-982X', 45, 85);

      // Right micro telemetry
      ctx.textAlign = 'right';
      ctx.fillText('MIND-GRID CORE GATEWAY: SECURE', width - 45, 55);
      ctx.fillText('SYSTEM MATRIX STATUS: SYS_ACTIVE', width - 45, 70);
      ctx.fillText('CIPHER TYPE: ACCELERATED AES-256', width - 45, 85);

      // 4. Subtle horizontal laser beam sweep (Matrix scanline)
      sweepY += 1.2;
      if (sweepY > height) sweepY = 0;

      const laserGrad = ctx.createLinearGradient(0, sweepY, 0, sweepY + 6);
      laserGrad.addColorStop(0, 'rgba(204, 255, 0, 0)');
      laserGrad.addColorStop(0.5, isL ? 'rgba(130, 180, 0, 0.1)' : 'rgba(204, 255, 0, 0.045)');
      laserGrad.addColorStop(1, 'rgba(204, 255, 0, 0)');
      ctx.fillStyle = laserGrad;
      ctx.fillRect(0, sweepY, width, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none block z-0 animate-fade-in"
      style={{
        mixBlendMode: isLightMode ? 'multiply' : 'screen',
        opacity: isLightMode ? 0.024 : 0.056
      }}
    />
  );
}
