import { useRef, useEffect } from 'react';

interface FlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: { r: number; g: number; b: number };
  icon: string;
  active: boolean;
  pulsePhase: number;
}

interface FlowEdge {
  from: number;
  to: number;
  particles: Array<{ t: number; speed: number }>;
}

interface CognitiveFlowProps {
  className?: string;
}

export function CognitiveFlow({ className = '' }: CognitiveFlowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let nodes: FlowNode[] = [];
    let edges: FlowEdge[] = [];

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const dpr = window.devicePixelRatio || 1;
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initNodes();
    };

    const initNodes = () => {
      const nodeW = 90;
      const nodeH = 36;
      const cx = w / 2;
      const topY = 30;
      const layerH = (h - 80) / 4;

      nodes = [
        { id: 'input', label: 'INPUT', x: cx, y: topY, width: nodeW, height: nodeH, color: { r: 99, g: 102, b: 241 }, icon: '⊕', active: true, pulsePhase: 0 },
        { id: 'planner', label: 'PLANNER', x: cx - 80, y: topY + layerH, width: nodeW, height: nodeH, color: { r: 16, g: 185, b: 129 }, icon: '◈', active: true, pulsePhase: 1 },
        { id: 'memory', label: 'MEMORY', x: cx + 80, y: topY + layerH, width: nodeW, height: nodeH, color: { r: 168, g: 85, b: 247 }, icon: '◉', active: true, pulsePhase: 2 },
        { id: 'researcher', label: 'RESEARCH', x: cx - 80, y: topY + layerH * 2, width: nodeW, height: nodeH, color: { r: 245, g: 158, b: 11 }, icon: '⟡', active: true, pulsePhase: 3 },
        { id: 'analyst', label: 'ANALYST', x: cx + 80, y: topY + layerH * 2, width: nodeW, height: nodeH, color: { r: 236, g: 72, b: 153 }, icon: '◇', active: true, pulsePhase: 4 },
        { id: 'writer', label: 'WRITER', x: cx, y: topY + layerH * 3, width: nodeW, height: nodeH, color: { r: 14, g: 165, b: 233 }, icon: '✦', active: true, pulsePhase: 5 },
        { id: 'output', label: 'OUTPUT', x: cx, y: topY + layerH * 4, width: nodeW, height: nodeH, color: { r: 0, g: 200, b: 83 }, icon: '◆', active: true, pulsePhase: 6 },
      ];

      edges = [
        { from: 0, to: 1, particles: [] },
        { from: 0, to: 2, particles: [] },
        { from: 1, to: 3, particles: [] },
        { from: 2, to: 3, particles: [] },
        { from: 2, to: 4, particles: [] },
        { from: 3, to: 5, particles: [] },
        { from: 4, to: 5, particles: [] },
        { from: 5, to: 6, particles: [] },
      ];

      for (const edge of edges) {
        for (let i = 0; i < 2; i++) {
          edge.particles.push({ t: Math.random(), speed: 0.003 + Math.random() * 0.004 });
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      time += 0.02;

      for (const edge of edges) {
        const from = nodes[edge.from];
        const to = nodes[edge.to];

        const x1 = from.x;
        const y1 = from.y + from.height / 2;
        const x2 = to.x;
        const y2 = to.y - to.height / 2;
        const midY = (y1 + y2) / 2;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(x1, midY, x2, midY, x2, y2);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        for (const particle of edge.particles) {
          particle.t += particle.speed;
          if (particle.t > 1) particle.t = 0;

          const t = particle.t;
          const mt = 1 - t;
          const px = mt * mt * mt * x1 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x2;
          const py = mt * mt * mt * y1 + 3 * mt * mt * t * midY + 3 * mt * t * t * midY + t * t * t * y2;

          const alpha = Math.sin(t * Math.PI) * 0.8;
          const col = from.color;

          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${alpha})`;
          ctx.fill();

          const glow = ctx.createRadialGradient(px, py, 0, px, py, 8);
          glow.addColorStop(0, `rgba(${col.r}, ${col.g}, ${col.b}, ${alpha * 0.3})`);
          glow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.beginPath();
          ctx.arc(px, py, 8, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }
      }

      for (const node of nodes) {
        const pulse = Math.sin(time + node.pulsePhase) * 0.15 + 0.85;
        const col = node.color;
        const nx = node.x - node.width / 2;
        const ny = node.y - node.height / 2;

        const bgGlow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.width * 0.8);
        bgGlow.addColorStop(0, `rgba(${col.r}, ${col.g}, ${col.b}, ${0.08 * pulse})`);
        bgGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.width * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = bgGlow;
        ctx.fill();

        const radius = 10;
        ctx.beginPath();
        ctx.moveTo(nx + radius, ny);
        ctx.lineTo(nx + node.width - radius, ny);
        ctx.quadraticCurveTo(nx + node.width, ny, nx + node.width, ny + radius);
        ctx.lineTo(nx + node.width, ny + node.height - radius);
        ctx.quadraticCurveTo(nx + node.width, ny + node.height, nx + node.width - radius, ny + node.height);
        ctx.lineTo(nx + radius, ny + node.height);
        ctx.quadraticCurveTo(nx, ny + node.height, nx, ny + node.height - radius);
        ctx.lineTo(nx, ny + radius);
        ctx.quadraticCurveTo(nx, ny, nx + radius, ny);
        ctx.closePath();

        ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * pulse})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${0.3 * pulse})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = 'bold 8px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, 0.9)`;
        ctx.fillText(node.label, node.x, node.y + 3);
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-3 left-4 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cognitive Pipeline</span>
      </div>
    </div>
  );
}
