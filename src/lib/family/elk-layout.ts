/**
 * Refines the positions produced by `buildGraph` with elkjs' layered algorithm.
 *
 * Every edge points downwards (partner → family junction → child), so elk's
 * layers line up with the generations while it does the work the grid cannot:
 * ordering each row to keep couples together and crossings low.
 */

import type { ELK, ElkNode } from "elkjs/lib/elk-api";
import {
	DEFAULT_LAYOUT,
	type FamilyGraph,
	type LayoutOptions,
} from "lib/family/layout";

let elk: Promise<ELK> | undefined;

/** Loads elk lazily: it is a big bundle and the grid renders without it. */
function getElk(): Promise<ELK> {
	if (!elk) {
		elk = import("elkjs/lib/elk.bundled.js").then(
			(module) => new module.default(),
		);
	}

	return elk;
}

export async function layoutWithElk(
	graph: FamilyGraph,
	options: LayoutOptions = {},
): Promise<FamilyGraph> {
	if (graph.nodes.length === 0) return graph;

	const layout = { ...DEFAULT_LAYOUT, ...options };
	const elkGraph: ElkNode = {
		id: "root",
		layoutOptions: {
			"elk.algorithm": "layered",
			"elk.direction": "DOWN",
			"elk.layered.spacing.nodeNodeBetweenLayers": String(layout.rowGap),
			"elk.spacing.nodeNode": String(layout.columnGap),
			"elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
		},
		children: graph.nodes.map((node) => ({
			id: node.id,
			width: node.width ?? layout.nodeWidth,
			height: node.height ?? layout.nodeHeight,
		})),
		edges: graph.edges.map((edge) => ({
			id: edge.id,
			sources: [edge.source],
			targets: [edge.target],
		})),
	};

	const laidOut = await (await getElk()).layout(elkGraph);
	const positions = new Map(
		(laidOut.children ?? []).map((child) => [
			child.id,
			{ x: child.x ?? 0, y: child.y ?? 0 },
		]),
	);

	return {
		nodes: graph.nodes.map((node) => {
			const position = positions.get(node.id);
			return position ? { ...node, position } : node;
		}),
		edges: graph.edges,
	};
}
