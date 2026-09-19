"use client";
import { useFamilyGraph } from "hooks/use-family-graph";
import { useFamilyTree } from "hooks/use-family-tree";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
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
import {
	DEFAULT_FOCUS_OPTIONS,
	type FocusOptions,
	pickDefaultFocus,
} from "lib/family/focus";
import type { FamilyGraphNode } from "lib/family/layout";
import { FamilyJunction } from "./family-junction";
import { FamilyNode } from "./family-node";
import { PersonPanel } from "./person-panel";
import { TreeControls } from "./tree-controls";

const nodeTypes = {
	person: FamilyNode,
	family: FamilyJunction,
};

const FamilyTree: FC = () => {
	const { familyData, loading, error } = useFamilyTree();
	const { fitView } = useReactFlow();

	const [focusId, setFocusId] = useState<string | null>(null);
	const [options, setOptions] = useState<Required<FocusOptions>>(
		DEFAULT_FOCUS_OPTIONS,
	);

	// Somebody has to be at the centre before anyone has chosen.
	const defaultFocus = useMemo(
		() => (familyData ? pickDefaultFocus(familyData) : undefined),
		[familyData],
	);
	const focus = focusId ?? defaultFocus ?? null;
	const graph = useFamilyGraph(familyData, focus ?? null, options);

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

	/**
	 * A relative in the panel may be outside the view: drawn, so bring them into
	 * sight; left out, so draw the tree around them instead.
	 */
	const selectRelative = useCallback(
		(id: string) => {
			if (nodes.some((node) => node.id === id)) {
				selectPerson(id);
				fitView({ nodes: [{ id }], duration: 400, maxZoom: 1 });
				return;
			}

			setFocusId(id);
		},
		[nodes, selectPerson, fitView],
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
	const shown = nodes.filter((node) => node.type === "person").length;

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
			{familyData && (
				<Panel position="top-left">
					<TreeControls
						data={familyData}
						focus={focus ? familyData.individuals[focus] : undefined}
						options={options}
						shown={shown}
						onFocus={setFocusId}
						onOptionsChange={setOptions}
					/>
				</Panel>
			)}
			{familyData && selected && (
				<Panel position="top-right">
					<PersonPanel
						data={familyData}
						person={selected}
						isFocus={selected.id === focus}
						onSelect={selectRelative}
						onFocus={setFocusId}
						onClose={closePanel}
					/>
				</Panel>
			)}
		</ReactFlow>
	);
};
export default FamilyTree;
