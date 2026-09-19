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
	const rowHeight = layout.nodeHeight + layout.rowGap;

	const nodes: FamilyGraphNode[] = [];
	const edges: Edge[] = [];

	const personColumns = new Map<number, number>();
	for (const member of Object.values(data.individuals)) {
		const generation = generations.get(member.id) ?? 0;
		const column = personColumns.get(generation) ?? 0;
		personColumns.set(generation, column + 1);

		nodes.push({
			id: member.id,
			type: "person",
			position: {
				x: column * (layout.nodeWidth + layout.columnGap),
				y: generation * rowHeight,
			},
			width: layout.nodeWidth,
			height: layout.nodeHeight,
			data: { member, generation },
		});
	}

	const junctionColumns = new Map<number, number>();
	for (const family of Object.values(data.families)) {
		const partners = partnersOf(data, family);
		const children = childrenOf(data, family);
		const generation = junctionGeneration(generations, partners, children);
		const column = junctionColumns.get(generation) ?? 0;
		junctionColumns.set(generation, column + 1);

		const id = junctionId(family.id);
		nodes.push({
			id,
			type: "family",
			position: {
				x: column * (layout.junctionSize + layout.columnGap),
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

	return { nodes, edges };
}
