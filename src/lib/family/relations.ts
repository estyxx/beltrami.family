/**
 * Walks `FamilyData` for the people directly related to an individual.
 * `FAMC` gives parents and siblings' family, `FAMS` gives partners and children.
 */

import type { FamilyData, FamilyMember } from "lib/family/types";

export type Relatives = {
	parents: FamilyMember[];
	partners: FamilyMember[];
	children: FamilyMember[];
};

export function getRelatives(data: FamilyData, id: string): Relatives {
	const member = data.individuals[id];
	if (!member) return { parents: [], partners: [], children: [] };

	const parents: FamilyMember[] = [];
	const partners: FamilyMember[] = [];
	const children: FamilyMember[] = [];

	for (const familyId of member.child_of_families) {
		const family = data.families[familyId];
		if (!family) continue;

		for (const parentId of [family.husband, family.wife]) {
			push(parents, data, parentId, id);
		}
	}

	for (const familyId of member.spouse_in_families) {
		const family = data.families[familyId];
		if (!family) continue;

		for (const partnerId of [family.husband, family.wife]) {
			push(partners, data, partnerId, id);
		}
		for (const childId of family.children) {
			push(children, data, childId, id);
		}
	}

	return { parents, partners, children };
}

/** Adds a known individual once, never the person we are looking at. */
function push(
	target: FamilyMember[],
	data: FamilyData,
	id: string | null | undefined,
	selfId: string,
): void {
	if (!id || id === selfId) return;

	const member = data.individuals[id];
	if (!member) return;
	if (target.some((existing) => existing.id === id)) return;

	target.push(member);
}
