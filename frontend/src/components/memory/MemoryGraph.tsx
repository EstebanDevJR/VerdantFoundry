import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { memory } from '@/lib/api';

const NODE_STYLE = {
  background: '#f8fafc',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  padding: '10px',
};

const EDGE_STYLE = { stroke: '#94a3b8' };

function layoutNodes(apiNodes: any[]) {
  const cols = Math.max(3, Math.ceil(Math.sqrt(apiNodes.length)));
  const spacingX = 220;
  const spacingY = 140;
  return apiNodes.map((node: any, i: number) => ({
    id: String(node.id),
    position: { x: (i % cols) * spacingX + 50, y: Math.floor(i / cols) * spacingY + 50 },
    data: { label: node.title || node.label || node.name || `Node ${node.id}` },
    style: NODE_STYLE,
  }));
}

function layoutEdges(apiEdges: any[]) {
  return apiEdges.map((edge: any, i: number) => ({
    id: edge.id ? String(edge.id) : `e-${edge.source}-${edge.target}-${i}`,
    source: String(edge.source),
    target: String(edge.target),
    animated: true,
    style: EDGE_STYLE,
  }));
}

export function MemoryGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    memory.getGraph()
      .then((data) => {
        if (cancelled) return;
        const apiNodes = Array.isArray(data.nodes) ? data.nodes : [];
        const apiEdges = Array.isArray(data.edges) ? data.edges : [];
        setNodes(layoutNodes(apiNodes));
        setEdges(layoutEdges(apiEdges));
      })
      .catch(() => {
        if (!cancelled) {
          setNodes([]);
          setEdges([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  if (loading) {
    return (
      <div className="w-full h-full bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-slate-300 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Loading graph...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        attributionPosition="bottom-right"
      >
        <Controls />
        <MiniMap zoomable pannable nodeColor="#e2e8f0" maskColor="rgba(248, 250, 252, 0.7)" />
        <Background color="#cbd5e1" gap={16} />
      </ReactFlow>
    </div>
  );
}
