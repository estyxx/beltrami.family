"use client";
import { useFamilyGraph } from "hooks/use-family-graph";
import { useFamilyTree } from "hooks/use-family-tree";
import { type FC, useCallback, useEffect, useMemo } from "react";
import "@xyflow/react/dist/style.css";
import {
	Background,
	Controls,
	type Edge,
	MiniMap,
	Panel,
	ReactFlow,
	useEdgesState,
	useNodesState,
	useReactFlow,
} from "@xyflow/react";
import type { FamilyGraphNode } from "lib/family/layout";
import { FamilyJunction } from "./family-junction";
import { FamilyNode } from "./family-node";
import { PersonPanel } from "./person-panel";

const nodeTypes = {
	person: FamilyNode,
	family: FamilyJunction,
};

const FamilyTree: FC = () => {
	const { familyData, loading, error } = useFamilyTree();
	const graph = useFamilyGraph(familyData);
	const { fitView } = useReactFlow();

	const [nodes, setNodes, onNodesChange] = useNodesState<FamilyGraphNode>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

	useEffect(() => {
		setNodes(graph.nodes);
		setEdges(graph.edges);
	}, [graph, setNodes, setEdges]);

	/** React Flow owns the selection; the panel follows the selected node. */
	const selectPerson = useCallback(
		(id: string | null) => {
			setNodes((current) =>
				current.map((node) =>
					node.selected === (node.id === id)
						? node
						: { ...node, selected: node.id === id },
				),
			);
		},
		[setNodes],
	);

	/** A link in the panel can point off screen, so bring that person into view. */
	const selectRelative = useCallback(
		(id: string) => {
			selectPerson(id);
			fitView({ nodes: [{ id }], duration: 400, maxZoom: 1 });
		},
		[selectPerson, fitView],
	);

	const closePanel = useCallback(() => selectPerson(null), [selectPerson]);

	const selectedId = useMemo(
		() => nodes.find((node) => node.selected)?.id,
		[nodes],
	);

	if (loading) {
		return <div>Caricamento dell'albero genealogico...</div>;
	}

	if (error) {
		return <div>Errore nel caricamento dell'albero: {error.message}</div>;
	}

	const selected = selectedId ? familyData?.individuals[selectedId] : undefined;

	return (
		<ReactFlow
			className="h-full w-full"
			nodes={nodes}
			edges={edges}
			onNodesChange={onNodesChange}
			onEdgesChange={onEdgesChange}
			nodeTypes={nodeTypes}
			nodesConnectable={false}
			fitView
		>
			<Background gap={16} className="text-gray-300" />
			<MiniMap
				nodeStrokeColor={(node) =>
					node.type === "person" ? "#06b6d4" : "#000"
				}
				nodeColor={(node) => (node.type === "person" ? "#cffafe" : "#fff")}
				nodeBorderRadius={2}
			/>
			<Controls className="text-gray-500" />
			{familyData && selected && (
				<Panel position="top-right">
					<PersonPanel
						data={familyData}
						person={selected}
						onSelect={selectRelative}
						onClose={closePanel}
					/>
				</Panel>
			)}
		</ReactFlow>
	);
};
export default FamilyTree;
