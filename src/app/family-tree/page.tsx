"use client";

import React, { useCallback } from "react";
import "@xyflow/react/dist/style.css";
import {
	Background,
	type Connection,
	Controls,
	type Edge,
	MiniMap,
	type Node,
	ReactFlow,
	addEdge,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";

// Nodes: Individuals in the family tree
const initialNodes: Node[] = [
	{
		id: "1",
		type: "default",
		position: { x: 0, y: 0 },
		data: { label: "John Doe" },
	},
	{
		id: "2",
		type: "default",
		position: { x: 200, y: 100 },
		data: { label: "Jane Doe" },
	},
	{
		id: "3",
		type: "default",
		position: { x: 400, y: 200 },
		data: { label: "Child Doe" },
	},
];

// Edges: Relationships between individuals
const initialEdges: Edge[] = [
	{ id: "e1-2", source: "1", target: "2", animated: true, label: "Spouse" },
	{ id: "e1-3", source: "1", target: "3", label: "Parent" },
	{ id: "e2-3", source: "2", target: "3", label: "Parent" },
];

// Custom Node Component with Tailwind Classes
interface CustomNodeData {
	label: string;
	birthDate?: string;
}

const CustomNode = ({ data }: { data: CustomNodeData }) => {
	return (
		<div className="p-4 border rounded-lg shadow-md bg-white border-gray-300">
			<strong className="block text-lg font-semibold text-gray-800">
				{data.label}
			</strong>
			{data.birthDate && (
				<p className="text-sm text-gray-600">
					<span className="font-medium">Birth:</span> {data.birthDate}
				</p>
			)}
		</div>
	);
};

// Register custom node
const nodeTypes = {
	custom: CustomNode,
};

export default function FamilyTreePage() {
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	const onConnect = useCallback(
		(params: Connection) => setEdges((eds) => addEdge(params, eds)),
		[setEdges],
	);

	return (
		<div className="h-full w-full bg-gray-100">
			<ReactFlow
				className="h-full w-full"
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				nodeTypes={nodeTypes}
				fitView
			>
				<Background gap={16} className="text-gray-300" />
				<MiniMap
					nodeStrokeColor={(node) =>
						node.type === "custom" ? "#06b6d4" : "#000"
					}
					nodeColor={(node) => (node.type === "custom" ? "#cffafe" : "#fff")}
					nodeBorderRadius={2}
				/>
				<Controls className="text-gray-500" />
			</ReactFlow>
		</div>
	);
}
