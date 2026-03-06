type DataPoint = { name: string; calls: number };

type Props = {
  data: DataPoint[];
  height?: number;
};

export function SimpleBarChart({ data, height = 200 }: Props) {
  const maxCalls = Math.max(...data.map((d) => d.calls), 1);
  const barHeight = Math.max(16, (height - 40) / data.length - 8);

  return (
    <div className="flex flex-col gap-3 w-full h-64">
      {data.map((item) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-600 w-24 shrink-0 truncate">{item.name}</span>
          <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
            <div
              className="h-full rounded bg-primary transition-all duration-500"
              style={{ width: `${(item.calls / maxCalls) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-slate-500 w-12 shrink-0 text-right">{item.calls.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
