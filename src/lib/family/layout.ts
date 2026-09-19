/**
 * Pure transform from `FamilyData` to React Flow nodes and edges.
 *
 * GEDCOM models relationships through `FAM` records, so every family becomes a
 * small junction node: partners point down into it and it points down at each
 * child. That keeps a child on a single parent edge instead of one per parent.
 *
 * Positions here are a plain generational grid. They are deterministic (so the
 * transform stays testable) and are what the canvas shows until elkjs refines
 * them, see `lib/family/elk-layout`.
 */

import type { Edge, Node } from "@xyflow/react";
import type { Family, FamilyData, FamilyMember } from "lib/family/types";

/** Prefix keeping junction ids from colliding with GEDCOM individual xrefs. */
const JUNCTION_PREFIX = "fam:";

/** Handle ids, shared by both node types so every edge can name them. */
export const TARGET_HANDLE = "top";
export const SOURCE_HANDLE = "bottom";

export type PersonNodeData = {
	member: FamilyMember;
	generation: number;
};

export type JunctionNodeData = {
	familyId: string;
	generation: number;
};

export type PersonNode = Node<PersonNodeData, "person">;
export type JunctionNode = Node<JunctionNodeData, "family">;
export type FamilyGraphNode = PersonNode | JunctionNode;

export type FamilyGraph = {
	nodes: FamilyGraphNode[];
	edges: Edge[];
};

/** Sizes and spacing, reused by the elk layout so both agree on geometry. */
export const DEFAULT_LAYOUT = {
	nodeWidth: 180,
	nodeHeight: 92,
	junctionSize: 12,
	columnGap: 48,
	rowGap: 120,
};

export type LayoutOptions = Partial<typeof DEFAULT_LAYOUT>;

export const EMPTY_GRAPH: FamilyGraph = { nodes: [], edges: [] };

/** The node id of the junction standing for a family. */
export function junctionId(familyId: string): string {
	return `${JUNCTION_PREFIX}${familyId}`;
}

function individual(
	data: FamilyData,
	id: string | null | undefined,
): FamilyMember | undefined {
	if (!id) return undefined;
	return data.individuals[id];
}

/** The partners of a family, skipping references to unknown individuals. */
function partnersOf(data: FamilyData, family: Family): FamilyMember[] {
	const husband = individual(data, family.husband);
	const wife = individual(data, family.wife);

	return [husband, wife].filter(
		(member): member is FamilyMember => member !== undefined,
	);
}

/** The children of a family, skipping references to unknown individuals. */
function childrenOf(data: FamilyData, family: Family): FamilyMember[] {
	return family.children
		.map((id) => individual(data, id))
		.filter((member): member is FamilyMember => member !== undefined);
}

/**
 * Generation 0 is anyone with no `FAMC`; every family pushes its children one
 * level below the deeper of the two partners, and partners share that level.
 *
 * Generations only ever grow, so the relaxation converges; the pass cap keeps
 * malformed data (a cycle of parents) from looping forever.
 */
function assignGenerations(data: FamilyData): Map<string, number> {
	const generations = new Map<string, number>();
	const members = Object.values(data.individuals);
	const families = Object.values(data.families);

	for (const member of members) {
		if (member.child_of_families.length === 0) generations.set(member.id, 0);
	}

	for (let pass = 0; pass <= members.length; pass++) {
		let changed = false;

		for (const family of families) {
			const partners = partnersOf(data, family);
			let partnerGeneration: number | undefined;

			for (const partner of partners) {
				const generation = generations.get(partner.id);
				if (generation === undefined) continue;
				if (partnerGeneration === undefined || generation > partnerGeneration) {
					partnerGeneration = generation;
				}
			}

			if (partnerGeneration === undefined) continue;

			for (const partner of partners) {
				if (isBelow(generations, partner.id, partnerGeneration)) continue;
				generations.set(partner.id, partnerGeneration);
				changed = true;
			}

			for (const child of childrenOf(data, family)) {
				if (isBelow(generations, child.id, partnerGeneration + 1)) continue;
				generations.set(child.id, partnerGeneration + 1);
				changed = true;
			}
		}

		if (!changed) break;
	}

	// Individuals only reachable through broken or cyclic links start at the top.
	for (const member of members) {
		if (!generations.has(member.id)) generations.set(member.id, 0);
	}

	return generations;
}

/** True when `id` already sits at or below `generation`. */
function isBelow(
	generations: Map<string, number>,
	id: string,
	generation: number,
): boolean {
	const current = generations.get(id);
	return current !== undefined && current >= generation;
}

/**
 * A junction sits one row below its partners. Without partners it is pulled up
 * from its children instead, so its children still hang below it.
 */
function junctionGeneration(
	generations: Map<string, number>,
	partners: FamilyMember[],
	children: FamilyMember[],
): number {
	const partnerGenerations = partners.map(
		(partner) => generations.get(partner.id) ?? 0,
	);
	if (partnerGenerations.length > 0) return Math.max(...partnerGenerations);

	const childGenerations = children.map(
		(child) => generations.get(child.id) ?? 0,
	);
	if (childGenerations.length > 0) return Math.min(...childGenerations) - 1;

	return 0;
}

/** The families an individual is a partner in, skipping unknown references. */
function familiesOf(data: FamilyData, member: FamilyMember): Family[] {
	return member.spouse_in_families
		.map((id) => data.families[id])
		.filter((family): family is Family => family !== undefined);
}

/**
 * Orders every generation so that couples stand next to each other and children
 * sit under their parents, which is what makes siblings and cousins read as
 * groups. Elk starts from this order when it untangles the rows, so the order
 * matters even though elk sets the final spacing.
 */
function orderGenerations(
	data: FamilyData,
	generations: Map<string, number>,
): Map<string, number> {
	const rows = new Map<number, string[]>();
	const columns = new Map<string, number>();
	const members = Object.values(data.individuals);

	const generationOf = (id: string): number => generations.get(id) ?? 0;

	const place = (member: FamilyMember): void => {
		if (columns.has(member.id)) return;

		const generation = generationOf(member.id);
		const row = rows.get(generation) ?? [];
		columns.set(member.id, row.length);
		row.push(member.id);
		rows.set(generation, row);

		// A partner belongs beside them, as long as they share the row.
		for (const family of familiesOf(data, member)) {
			for (const partner of partnersOf(data, family)) {
				if (generationOf(partner.id) === generation) place(partner);
			}
		}
	};

	const ordered = Array.from(
		new Set(members.map((member) => generationOf(member.id))),
	).sort((first, second) => first - second);

	for (const generation of ordered) {
		// Whoever their parents did not already pull in follows, in file order.
		for (const member of members) {
			if (generationOf(member.id) === generation) place(member);
		}

		// Then hand the next row down to this one's children.
		for (const id of Array.from(rows.get(generation) ?? [])) {
			const member = data.individuals[id];
			if (!member) continue;

			for (const family of familiesOf(data, member)) {
				for (const child of childrenOf(data, family)) {
					if (generationOf(child.id) === generation + 1) place(child);
				}
			}
		}
	}

	return columns;
}

/**
 * Builds the React Flow graph for a family tree: one node per individual, one
 * invisible junction node per family, partner edges from each partner into the
 * junction and one edge from the junction to each child.
 */
export function buildGraph(
	data: FamilyData,
	options: LayoutOptions = {},
): FamilyGraph {
	const layout = { ...DEFAULT_LAYOUT, ...options };
	const generations = assignGenerations(data);
	const columns = orderGenerations(data, generations);
	const rowHeight = layout.nodeHeight + layout.rowGap;
	const columnWidth = layout.nodeWidth + layout.columnGap;

	const nodes: FamilyGraphNode[] = [];
	const edges: Edge[] = [];

	for (const member of Object.values(data.individuals)) {
		const generation = generations.get(member.id) ?? 0;
		const x = (columns.get(member.id) ?? 0) * columnWidth;

		nodes.push({
			id: member.id,
			type: "person",
			position: { x, y: generation * rowHeight },
			width: layout.nodeWidth,
			height: layout.nodeHeight,
			data: { member, generation },
		});
	}

	for (const family of Object.values(data.families)) {
		const partners = partnersOf(data, family);
		const children = childrenOf(data, family);
		const generation = junctionGeneration(generations, partners, children);

		const id = junctionId(family.id);
		nodes.push({
			id,
			type: "family",
			position: {
				// alignJunctions puts it between the people it joins, below.
				x: 0,
				// Halfway down the gap between the partners' row and the children's.
				y:
					generation * rowHeight +
					layout.nodeHeight +
					(layout.rowGap - layout.junctionSize) / 2,
			},
			width: layout.junctionSize,
			height: layout.junctionSize,
			// A junction stands for a record, not a person: nothing to select or drag.
			selectable: false,
			draggable: false,
			data: { familyId: family.id, generation },
		});

		for (const partner of partners) {
			edges.push({
				id: `${family.id}-partner-${partner.id}`,
				source: partner.id,
				sourceHandle: SOURCE_HANDLE,
				target: id,
				targetHandle: TARGET_HANDLE,
				type: "smoothstep",
			});
		}

		for (const child of children) {
			edges.push({
				id: `${family.id}-child-${child.id}`,
				source: id,
				sourceHandle: SOURCE_HANDLE,
				target: child.id,
				targetHandle: TARGET_HANDLE,
				type: "smoothstep",
			});
		}
	}

	return alignJunctions(centreParents({ nodes, edges }, options), options);
}

/**
 * Who hangs off each junction: the partners pointing into it, and the children
 * hanging below it.
 */
function familyLinks(graph: FamilyGraph): {
	partners: Map<string, FamilyGraphNode[]>;
	children: Map<string, FamilyGraphNode[]>;
} {
	const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
	const partners = new Map<string, FamilyGraphNode[]>();
	const children = new Map<string, FamilyGraphNode[]>();

	for (const edge of graph.edges) {
		const from = nodeById.get(edge.source);
		const into = nodeById.get(edge.target);

		if (into?.type === "family" && from) {
			partners.set(into.id, [...(partners.get(into.id) ?? []), from]);
		}
		if (from?.type === "family" && into) {
			children.set(from.id, [...(children.get(from.id) ?? []), into]);
		}
	}

	return { partners, children };
}

/** The middle of a set of nodes, or undefined when there are none. */
function centreOf(
	nodes: FamilyGraphNode[],
	x: (node: FamilyGraphNode) => number,
	fallbackWidth: number,
): number | undefined {
	if (nodes.length === 0) return undefined;

	const total = nodes.reduce(
		(sum, node) => sum + x(node) + (node.width ?? fallbackWidth) / 2,
		0,
	);

	return total / nodes.length;
}

/**
 * Hangs every couple above the middle of their children, working from the
 * youngest generation upwards, and pushes apart anyone who would end up on top
 * of somebody else.
 *
 * This is what makes the drawing read as a family tree. Elk gives the rows a
 * sensible order and spacing, but it has no reason to keep a couple above their
 * own children, so without this pass the lines run right across the canvas.
 *
 * @param graph - Nodes and edges, with the people already placed in rows
 * @param options - Sizes and spacing, matching the ones used to place them
 * @returns The same graph with the parents moved
 */
export function centreParents(
	graph: FamilyGraph,
	options: LayoutOptions = {},
): FamilyGraph {
	const layout = { ...DEFAULT_LAYOUT, ...options };
	const { partners, children } = familyLinks(graph);
	const moved = new Map<string, number>();

	const xOf = (node: FamilyGraphNode): number =>
		moved.get(node.id) ?? node.position.x;
	const widthOf = (node: FamilyGraphNode): number =>
		node.width ?? layout.nodeWidth;

	// The junctions each person is a partner in, to find couples and children.
	const junctionsOf = new Map<string, string[]>();
	for (const [junction, people] of Array.from(partners)) {
		for (const person of people) {
			junctionsOf.set(person.id, [
				...(junctionsOf.get(person.id) ?? []),
				junction,
			]);
		}
	}

	const rows = new Map<number, FamilyGraphNode[]>();
	for (const node of graph.nodes) {
		if (node.type !== "person") continue;

		rows.set(node.position.y, [...(rows.get(node.position.y) ?? []), node]);
	}

	const youngestFirst = Array.from(rows.keys()).sort(
		(first, second) => second - first,
	);

	for (const y of youngestFirst) {
		const row = (rows.get(y) ?? []).sort((a, b) => xOf(a) - xOf(b));
		let previousRight = Number.NEGATIVE_INFINITY;

		for (const unit of coupleUnits(row, junctionsOf, partners, xOf)) {
			const left = Math.min(...unit.map(xOf));
			const right = Math.max(...unit.map((node) => xOf(node) + widthOf(node)));

			const theirChildren = unit
				.flatMap((node) => junctionsOf.get(node.id) ?? [])
				.flatMap((junction) => children.get(junction) ?? []);
			const wanted =
				centreOf(theirChildren, xOf, layout.nodeWidth) ?? (left + right) / 2;

			const shift = Math.max(
				wanted - (left + right) / 2,
				previousRight + layout.columnGap - left,
			);

			for (const node of unit) moved.set(node.id, xOf(node) + shift);
			previousRight = Math.max(
				...unit.map((node) => xOf(node) + widthOf(node)),
			);
		}
	}

	return {
		nodes: graph.nodes.map((node) => {
			const x = moved.get(node.id);

			return x === undefined
				? node
				: { ...node, position: { ...node.position, x } };
		}),
		edges: graph.edges,
	};
}

/** Groups a row into couples that share a family, and everyone else alone. */
function coupleUnits(
	row: FamilyGraphNode[],
	junctionsOf: Map<string, string[]>,
	partners: Map<string, FamilyGraphNode[]>,
	xOf: (node: FamilyGraphNode) => number,
): FamilyGraphNode[][] {
	const inRow = new Map(row.map((node) => [node.id, node]));
	const taken = new Set<string>();
	const units: FamilyGraphNode[][] = [];

	for (const node of row) {
		if (taken.has(node.id)) continue;

		const unit = [node];
		taken.add(node.id);

		for (const junction of junctionsOf.get(node.id) ?? []) {
			for (const partner of partners.get(junction) ?? []) {
				if (taken.has(partner.id) || !inRow.has(partner.id)) continue;

				unit.push(partner);
				taken.add(partner.id);
			}
		}

		units.push(unit.sort((a, b) => xOf(a) - xOf(b)));
	}

	return units;
}

/**
 * Slides every junction to the middle of the people it joins, so a couple's two
 * edges meet at a point between them, then nudges junctions that landed on the
 * same spot apart. Runs on the grid and again on elk's positions, because both
 * move the people around.
 * @param graph - Nodes and edges, with the people already placed
 * @param options - Sizes and spacing, matching the ones used to place the people
 * @returns The same graph with the junctions moved
 */
export function alignJunctions(
	graph: FamilyGraph,
	options: LayoutOptions = {},
): FamilyGraph {
	const layout = { ...DEFAULT_LAYOUT, ...options };
	const { partners, children } = familyLinks(graph);

	type Placement = { id: string; x: number };
	const rows = new Map<number, Placement[]>();
	for (const node of graph.nodes) {
		if (node.type !== "family") continue;

		// Between the couple when there is one, otherwise above the children.
		const anchors = partners.get(node.id) ?? children.get(node.id) ?? [];
		const middle = centreOf(
			anchors,
			(anchor) => anchor.position.x,
			layout.nodeWidth,
		);
		if (middle === undefined) continue;

		const row = rows.get(node.position.y) ?? [];
		row.push({ id: node.id, x: middle - layout.junctionSize / 2 });
		rows.set(node.position.y, row);
	}

	const placed = new Map<string, number>();
	const spacing = layout.junctionSize + layout.columnGap;
	for (const row of Array.from(rows.values())) {
		let previous = Number.NEGATIVE_INFINITY;

		for (const placement of row.sort((first, second) => first.x - second.x)) {
			const x = Math.max(placement.x, previous + spacing);
			placed.set(placement.id, x);
			previous = x;
		}
	}

	return {
		nodes: graph.nodes.map((node) => {
			const x = placed.get(node.id);

			return x === undefined
				? node
				: { ...node, position: { ...node.position, x } };
		}),
		edges: graph.edges,
	};
}
