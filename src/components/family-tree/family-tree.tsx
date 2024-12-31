"use client";
import { useFamilyTree } from "hooks/use-family-tree";
import { type FC, useCallback, useEffect } from "react";
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
import { FamilyNode } from "components/family-tree";

// Register custom node
const nodeTypes = {
	custom: FamilyNode,
};

const FamilyTree: FC = () => {
	const { familyData, loading, error } = useFamilyTree();

	const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

	const onConnect = useCallback(
		(params: Connection) => setEdges((eds) => addEdge(params, eds)),
		[setEdges],
	);

	// Transform familyData into nodes and edges when familyData updates
	useEffect(() => {
		if (!familyData) return;

		const nodes: Node[] = [];
		const edges: Edge[] = [];
		const positions = new Map();
		let currentX = 0;
		let currentY = 0;

		// Create nodes for each individual
		for (const individual of Object.values(familyData?.individuals)) {
			if (!positions.has(individual.id)) {
				positions.set(individual.id, { x: currentX, y: currentY });
				currentX += 250;
				if (currentX > 1000) {
					currentX = 0;
					currentY += 200;
				}
			}

			nodes.push({
				id: individual.id,
				type: "custom",
				position: positions.get(individual.id),
				data: {
					...individual,
					label: `${individual.given_name} ${individual.surname}`,
				},
			});
		}

		// Create edges for family relationships
		for (const family of Object.values(familyData.families)) {
			if (family.husband && family.wife) {
				edges.push({
					id: `${family.husband}-${family.wife}`,
					source: family.husband,
					target: family.wife,
					type: "straight",
					label: "Spouse",
					animated: true,
				});
			}

			if (family.children) {
				for (const childId of family.children) {
					if (family.husband) {
						edges.push({
							id: `${family.husband}-${childId}`,
							source: family.husband,
							target: childId,
							type: "straight",
							label: "Parent",
						});
					}

					if (family.wife) {
						edges.push({
							id: `${family.wife}-${childId}`,
							source: family.wife,
							target: childId,
							type: "straight",
							label: "Parent",
						});
					}
				}
			}
		}

		setNodes(nodes);
		setEdges(edges);
	}, [familyData, setNodes, setEdges]);

	if (loading) {
		return <div>Loading family tree...</div>;
	}

	if (error) {
		return <div>Error loading family tree: {error.message}</div>;
	}

	return (
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
	);
};
export default FamilyTree;
