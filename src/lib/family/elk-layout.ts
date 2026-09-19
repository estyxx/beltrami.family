/**
 * Refines the positions produced by `buildGraph` with elkjs' layered algorithm.
 *
 * Every edge points downwards (partner → family junction → child), so elk's
 * layers line up with the generations while it does the work the grid cannot:
 * ordering each row to keep couples together and crossings low.
 */

import type { ELK, ElkNode } from "elkjs/lib/elk-api";
import {
	alignJunctions,
	centreParents,
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
			// Both interactive strategies read the structure off the positions we
			// pass in: the row is the generation, and the order within a row keeps
			// couples together. Left to itself elk would rank by longest path and
			// reorder the rows, which splits couples and drops a childless person a
			// row away from their own cousins. What elk adds is the spacing and the
			// centring of parents over their children.
			"elk.layered.layering.strategy": "INTERACTIVE",
			"elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
			"elk.layered.spacing.nodeNodeBetweenLayers": String(layout.rowGap),
			"elk.spacing.nodeNode": String(layout.columnGap),
			"elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
		},
		children: graph.nodes.map((node) => ({
			id: node.id,
			width: node.width ?? layout.nodeWidth,
			height: node.height ?? layout.nodeHeight,
			// The grid position is the hint: its row is the generation, and its
			// column is the order elk starts from when it untangles the rows.
			x: node.position.x,
			y: node.position.y,
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

	const spaced: FamilyGraph = {
		nodes: graph.nodes.map((node) => {
			const position = positions.get(node.id);
			return position ? { ...node, position } : node;
		}),
		edges: graph.edges,
	};

	return alignJunctions(centreParents(spaced, options), options);
}
