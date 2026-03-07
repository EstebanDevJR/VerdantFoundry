import { useRef, useEffect } from 'react';

interface Gene {
  label: string;
  value: number;
  category: 'cognitive' | 'motor' | 'social' | 'memory' | 'creative';
}

interface AgentGenomeProps {
  agent: {
    name: string;
    role: string;
    status: string;
    tasks: number;
    uptime: string;
  };
  className?: string;
}

const categoryColors: Record<Gene['category'], { r: number; g: number; b: number }> = {
  cognitive: { r: 99, g: 102, b: 241 },
  motor: { r: 16, g: 185, b: 129 },
  social: { r: 245, g: 158, b: 11 },
  memory: { r: 168, g: 85, b: 247 },
  creative: { r: 236, g: 72, b: 153 },
};

function deriveGenome(agent: AgentGenomeProps['agent']): Gene[] {
  const hash = agent.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const roleHash = agent.role.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  return [
    { label: 'Reasoning', value: 0.4 + (hash % 60) / 100, category: 'cognitive' },
    { label: 'Pattern Recognition', value: 0.3 + (roleHash % 70) / 100, category: 'cognitive' },
    { label: 'Task Execution', value: Math.min(1, agent.tasks / 50 + 0.3), category: 'motor' },
    { label: 'Speed', value: 0.5 + ((hash * 3) % 50) / 100, category: 'motor' },
    { label: 'Collaboration', value: 0.4 + ((roleHash * 2) % 55) / 100, category: 'social' },
    { label: 'Communication', value: 0.5 + ((hash * 7) % 45) / 100, category: 'social' },
    { label: 'Retrieval', value: 0.3 + ((hash * 11) % 65) / 100, category: 'memory' },
    { label: 'Persistence', value: 0.4 + ((roleHash * 5) % 55) / 100, category: 'memory' },
    { label: 'Novelty', value: 0.2 + ((hash * 13) % 75) / 100, category: 'creative' },
    { label: 'Adaptability', value: agent.status === 'Active' ? 0.8 + Math.random() * 0.2 : 0.3 + Math.random() * 0.4, category: 'creative' },
  ];
}

export function AgentGenome({ agent, className = '' }: AgentGenomeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const genesRef = useRef<Gene[]>(deriveGenome(agent));

  useEffect(() => {
    genesRef.current = deriveGenome(agent);
  }, [agent]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;

    const animate = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);
      time += 0.015;

      const genes = genesRef.current;
      const centerX = w / 2;
      const amplitude = w * 0.12;
      const geneSpacing = (h - 40) / (genes.length + 1);
      const helixOffset = Math.PI;

      for (let i = 0; i < genes.length; i++) {
        const gene = genes[i];
        const y = 20 + geneSpacing * (i + 1);
        const phase = time + i * 0.6;

        const x1 = centerX + Math.sin(phase) * amplitude;
        const x2 = centerX + Math.sin(phase + helixOffset) * amplitude;
        const depth1 = Math.cos(phase);
        const depth2 = Math.cos(phase + helixOffset);

        const col = categoryColors[gene.category];

        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        const rungAlpha = 0.15 + gene.value * 0.2;
        ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${rungAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        const geneX = (x1 + x2) / 2;
        const barWidth = Math.abs(x2 - x1) * gene.value * 0.6;
        ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${0.1 + gene.value * 0.15})`;
        ctx.fillRect(geneX - barWidth / 2, y - 3, barWidth, 6);

        const r1 = 3 + gene.value * 4;
        const alpha1 = 0.4 + depth1 * 0.3;
        ctx.beginPath();
        ctx.arc(x1, y, r1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${Math.max(0.15, alpha1)})`;
        ctx.fill();
        if (depth1 > 0) {
          ctx.beginPath();
          ctx.arc(x1, y, r1 * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${0.5 * depth1})`;
          ctx.fill();
        }

        const r2 = 3 + gene.value * 4;
        const alpha2 = 0.4 + depth2 * 0.3;
        ctx.beginPath();
        ctx.arc(x2, y, r2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${Math.max(0.15, alpha2)})`;
        ctx.fill();
        if (depth2 > 0) {
          ctx.beginPath();
          ctx.arc(x2, y, r2 * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${0.5 * depth2})`;
          ctx.fill();
        }

        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillStyle = `rgba(100, 116, 139, 0.7)`;
        const labelX = centerX - amplitude - 20;
        ctx.fillText(gene.label.toUpperCase(), labelX, y + 3);

        ctx.textAlign = 'left';
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, 0.8)`;
        const valX = centerX + amplitude + 20;
        ctx.fillText(`${Math.round(gene.value * 100)}%`, valX, y + 3);
      }

      const helixPoints1: { x: number; y: number }[] = [];
      const helixPoints2: { x: number; y: number }[] = [];
      for (let y = 10; y < h - 10; y += 2) {
        const phase = time + ((y - 20) / geneSpacing) * 0.6;
        helixPoints1.push({ x: centerX + Math.sin(phase) * amplitude, y });
        helixPoints2.push({ x: centerX + Math.sin(phase + helixOffset) * amplitude, y });
      }

      const drawHelix = (points: { x: number; y: number }[], color: string) => {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      };

      drawHelix(helixPoints1, 'rgba(0, 200, 83, 0.25)');
      drawHelix(helixPoints2, 'rgba(99, 102, 241, 0.25)');

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-2 left-2 flex flex-wrap gap-2">
        {Object.entries(categoryColors).map(([cat, col]) => (
          <div key={cat} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: `rgb(${col.r},${col.g},${col.b})` }}
            />
            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">{cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
