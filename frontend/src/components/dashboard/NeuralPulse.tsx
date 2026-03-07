import { useRef, useEffect, useCallback } from 'react';

interface Neuron {
  x: number;
  y: number;
  radius: number;
  pulsePhase: number;
  pulseSpeed: number;
  connections: number[];
  firing: boolean;
  fireTimer: number;
  fireDuration: number;
  layer: number;
}

interface NeuralPulseProps {
  activeAgents?: number;
  systemLoad?: number;
  className?: string;
}

export function NeuralPulse({ activeAgents = 3, systemLoad = 45, className = '' }: NeuralPulseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const neuronsRef = useRef<Neuron[]>([]);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  const initNeurons = useCallback((width: number, height: number) => {
    const neurons: Neuron[] = [];
    const layers = 5;
    const neuronsPerLayer = [3, 5, 7, 5, 3];
    let id = 0;

    for (let layer = 0; layer < layers; layer++) {
      const count = neuronsPerLayer[layer];
      const layerX = (width / (layers + 1)) * (layer + 1);
      for (let n = 0; n < count; n++) {
        const layerY = (height / (count + 1)) * (n + 1);
        neurons.push({
          x: layerX + (Math.random() - 0.5) * 20,
          y: layerY + (Math.random() - 0.5) * 15,
          radius: 3 + Math.random() * 3,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.02 + Math.random() * 0.03,
          connections: [],
          firing: false,
          fireTimer: 0,
          fireDuration: 30 + Math.random() * 40,
          layer,
        });
        id++;
      }
    }

    for (let i = 0; i < neurons.length; i++) {
      const neuron = neurons[i];
      for (let j = i + 1; j < neurons.length; j++) {
        const other = neurons[j];
        if (Math.abs(neuron.layer - other.layer) === 1) {
          const dist = Math.hypot(neuron.x - other.x, neuron.y - other.y);
          if (dist < width * 0.35) {
            neuron.connections.push(j);
          }
        }
      }
    }

    return neurons;
  }, []);

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
      neuronsRef.current = initNeurons(rect.width, rect.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const fireRate = Math.max(0.005, (systemLoad / 100) * 0.04 + (activeAgents * 0.005));

    const animate = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);
      timeRef.current++;
      const neurons = neuronsRef.current;

      for (const neuron of neurons) {
        if (!neuron.firing && Math.random() < fireRate) {
          neuron.firing = true;
          neuron.fireTimer = 0;
        }
        if (neuron.firing) {
          neuron.fireTimer++;
          if (neuron.fireTimer > neuron.fireDuration) {
            neuron.firing = false;
            neuron.fireTimer = 0;
          }
        }
        neuron.pulsePhase += neuron.pulseSpeed;
      }

      for (const neuron of neurons) {
        for (const connIdx of neuron.connections) {
          const target = neurons[connIdx];
          const firing = neuron.firing || target.firing;
          const progress = neuron.firing ? neuron.fireTimer / neuron.fireDuration : 0;

          ctx.beginPath();
          ctx.moveTo(neuron.x, neuron.y);

          const midX = (neuron.x + target.x) / 2;
          const midY = (neuron.y + target.y) / 2 + Math.sin(timeRef.current * 0.02 + neuron.x) * 8;
          ctx.quadraticCurveTo(midX, midY, target.x, target.y);

          if (firing) {
            const gradient = ctx.createLinearGradient(neuron.x, neuron.y, target.x, target.y);
            gradient.addColorStop(0, `rgba(0, 200, 83, ${0.6 * (1 - progress)})`);
            gradient.addColorStop(0.5, `rgba(105, 240, 174, ${0.4 * (1 - progress)})`);
            gradient.addColorStop(1, `rgba(0, 200, 83, ${0.2 * (1 - progress)})`);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.5;
          } else {
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
            ctx.lineWidth = 0.5;
          }
          ctx.stroke();

          if (neuron.firing && progress > 0.1 && progress < 0.9) {
            const t = progress;
            const px = (1 - t) * (1 - t) * neuron.x + 2 * (1 - t) * t * midX + t * t * target.x;
            const py = (1 - t) * (1 - t) * neuron.y + 2 * (1 - t) * t * midY + t * t * target.y;

            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 200, 83, ${0.9 * (1 - Math.abs(progress - 0.5) * 2)})`;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(105, 240, 174, ${0.3 * (1 - Math.abs(progress - 0.5) * 2)})`;
            ctx.fill();
          }
        }
      }

      for (const neuron of neurons) {
        const pulse = Math.sin(neuron.pulsePhase) * 0.3 + 0.7;
        const r = neuron.radius * (neuron.firing ? 1.5 : 1);

        if (neuron.firing) {
          const glowR = r * 4;
          const glow = ctx.createRadialGradient(neuron.x, neuron.y, 0, neuron.x, neuron.y, glowR);
          glow.addColorStop(0, 'rgba(0, 200, 83, 0.35)');
          glow.addColorStop(0.5, 'rgba(105, 240, 174, 0.1)');
          glow.addColorStop(1, 'rgba(0, 200, 83, 0)');
          ctx.beginPath();
          ctx.arc(neuron.x, neuron.y, glowR, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(neuron.x, neuron.y, r, 0, Math.PI * 2);
        if (neuron.firing) {
          ctx.fillStyle = `rgba(0, 200, 83, ${0.9 * pulse})`;
        } else {
          ctx.fillStyle = `rgba(148, 163, 184, ${0.3 * pulse + 0.2})`;
        }
        ctx.fill();

        ctx.beginPath();
        ctx.arc(neuron.x, neuron.y, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = neuron.firing ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)';
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [initNeurons, activeAgents, systemLoad]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute bottom-3 left-4 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Neural Activity</span>
      </div>
      <div className="absolute bottom-3 right-4">
        <span className="text-[10px] font-mono text-slate-400">
          {activeAgents} nodes &middot; {systemLoad}% load
        </span>
      </div>
    </div>
  );
}
