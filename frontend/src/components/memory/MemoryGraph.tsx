import React, { useCallback } from 'react';
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

const initialNodes = [
  { id: '1', position: { x: 250, y: 50 }, data: { label: 'User Profile' }, style: { background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px' } },
  { id: '2', position: { x: 100, y: 150 }, data: { label: 'Preferences' }, style: { background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px' } },
  { id: '3', position: { x: 400, y: 150 }, data: { label: 'Recent Activity' }, style: { background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px' } },
  { id: '4', position: { x: 250, y: 250 }, data: { label: 'Project Alpha' }, style: { background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#94a3b8' } },
  { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: '#94a3b8' } },
  { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#94a3b8' } },
];

export function MemoryGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

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
