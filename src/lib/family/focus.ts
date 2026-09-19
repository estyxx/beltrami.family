/**
 * Picks the part of the tree to draw around one person.
 *
 * A whole GEDCOM export laid out at once is unreadable, and a family tree is
 * always read from somebody: their ancestors above, their descendants below,
 * and the side branches that turn into siblings and cousins.
 *
 * Coming back down the ancestor line as far as we walked up is what produces
 * the collateral relatives: from a parent, one level down gives siblings; from
 * a grandparent, two levels give first cousins; and so on.
 */

import { getRelatives } from "lib/family/relations";
import type { FamilyData } from "lib/family/types";

export type FocusOptions = {
	/** Generations of ancestors to keep above the focus. */
	ancestors?: number;
	/** Generations of descendants to keep below the focus. */
	descendants?: number;
	/** Keep the side branches: siblings, cousins, their partners and children. */
	collateral?: boolean;
};

export const DEFAULT_FOCUS_OPTIONS = {
	ancestors: 3,
	descendants: 3,
	collateral: true,
};

export const EMPTY_FAMILY_DATA: FamilyData = { individuals: {}, families: {} };

/**
 * The tree around `focusId`, as a smaller `FamilyData` that `buildGraph` can
 * lay out.
 * @param data - The whole tree
 * @param focusId - The person the view is built around
 * @param options - How far to reach in each direction
 * @returns The individuals and families to draw; empty if the focus is unknown
 */
export function selectRelatives(
	data: FamilyData,
	focusId: string,
	options: FocusOptions = {},
): FamilyData {
	const { ancestors, descendants, collateral } = {
		...DEFAULT_FOCUS_OPTIONS,
		...options,
	};

	if (!data.individuals[focusId]) return EMPTY_FAMILY_DATA;

	const kept = new Set<string>([focusId]);

	// Walk up, remembering how far above the focus each ancestor sits.
	const heights = new Map<string, number>([[focusId, 0]]);
	let frontier = [focusId];
	for (let height = 1; height <= ancestors; height++) {
		const next: string[] = [];

		for (const id of frontier) {
			for (const parent of getRelatives(data, id).parents) {
				if (heights.has(parent.id)) continue;

				heights.set(parent.id, height);
				kept.add(parent.id);
				next.push(parent.id);
			}
		}

		frontier = next;
	}

	addDescendants(data, focusId, descendants, kept);

	if (collateral) {
		for (const [id, height] of Array.from(heights)) {
			if (height === 0) continue;

			addDescendants(data, id, height, kept);
		}
	}

	// Partners of everyone kept, so couples are drawn together. Iterating a
	// snapshot keeps this to one step: a partner's own family is not pulled in.
	for (const id of Array.from(kept)) {
		for (const partner of getRelatives(data, id).partners) {
			kept.add(partner.id);
		}
	}

	return pruneTo(data, kept);
}

/** Adds up to `depth` generations of descendants of `rootId` to `kept`. */
function addDescendants(
	data: FamilyData,
	rootId: string,
	depth: number,
	kept: Set<string>,
): void {
	const seen = new Set<string>([rootId]);
	let frontier = [rootId];

	for (let level = 0; level < depth; level++) {
		const next: string[] = [];

		for (const id of frontier) {
			for (const child of getRelatives(data, id).children) {
				if (seen.has(child.id)) continue;

				seen.add(child.id);
				kept.add(child.id);
				next.push(child.id);
			}
		}

		frontier = next;
	}
}

/**
 * Narrows the data to `kept`. A family is worth drawing only when two of its
 * members survived: a junction hanging off a single person says nothing.
 */
function pruneTo(data: FamilyData, kept: Set<string>): FamilyData {
	const individuals: FamilyData["individuals"] = {};
	for (const [id, member] of Object.entries(data.individuals)) {
		if (kept.has(id)) individuals[id] = member;
	}

	const families: FamilyData["families"] = {};
	for (const [id, family] of Object.entries(data.families)) {
		const members = [family.husband, family.wife, ...family.children].filter(
			(memberId) => memberId && kept.has(memberId),
		);

		if (members.length >= 2) families[id] = family;
	}

	return { individuals, families };
}

/**
 * A person to open the tree on before anyone has chosen: whoever has the most
 * descendants, so the first view shows the tree rather than a leaf of it.
 * @param data - The whole tree
 * @returns That individual's id, or undefined when there are no individuals
 */
export function pickDefaultFocus(data: FamilyData): string | undefined {
	const counts = new Map<string, number>();
	let best: string | undefined;

	for (const id of Object.keys(data.individuals)) {
		const count = countDescendants(data, id, counts);

		if (best === undefined || count > (counts.get(best) ?? 0)) best = id;
	}

	return best;
}

/**
 * Descendants of `id`, memoised across calls. Someone reachable through two
 * families is counted twice, which is close enough to rank people by.
 */
function countDescendants(
	data: FamilyData,
	id: string,
	counts: Map<string, number>,
	visiting: Set<string> = new Set(),
): number {
	const cached = counts.get(id);
	if (cached !== undefined) return cached;
	// Only reachable if the data has a loop of parents; stop rather than hang.
	if (visiting.has(id)) return 0;

	visiting.add(id);
	let total = 0;
	for (const child of getRelatives(data, id).children) {
		total += 1 + countDescendants(data, child.id, counts, visiting);
	}
	visiting.delete(id);

	counts.set(id, total);

	return total;
}
