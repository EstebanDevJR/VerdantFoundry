import { useMemo } from 'react';

type DataPoint = { time: string; load: number; memory: number };

type Props = {
  data: DataPoint[];
  width?: number;
  height?: number;
};

export function SimpleAreaChart({ data, width = 400, height = 200 }: Props) {
  const { loadPath, memoryPath } = useMemo(() => {
    const max = Math.max(...data.flatMap((d) => [d.load, d.memory]), 100);
    const pad = 8;
    const w = width - pad * 2;
    const h = height - pad * 2;
    const points = data.length;
    const step = points > 1 ? w / (points - 1) : w;

    const loadCoords = data.map((d, i) => [pad + i * step, pad + h - (d.load / max) * h]);
    const memoryCoords = data.map((d, i) => [pad + i * step, pad + h - (d.memory / max) * h]);

    const toPath = (coords: number[][]) =>
      coords.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ') + ` L ${coords[coords.length - 1]![0]} ${pad + h} L ${coords[0]![0]} ${pad + h} Z`;

    return {
      loadPath: toPath(loadCoords),
      memoryPath: toPath(memoryCoords),
    };
  }, [data, width, height]);

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="min-h-[200px]">
      <defs>
        <linearGradient id="chartLoad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="chartMemory" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={loadPath} fill="url(#chartLoad)" stroke="var(--color-primary)" strokeWidth={2} strokeLinejoin="round" />
      <path d={memoryPath} fill="url(#chartMemory)" stroke="#64748b" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}
