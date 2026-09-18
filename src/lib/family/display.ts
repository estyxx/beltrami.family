/**
 * Display helpers for GEDCOM values: names arrive as `Given /Surname/` and
 * dates can be qualified (`ABT 1890`), so both need cleaning before rendering.
 */

import type { FamilyMember, LifeEvent } from "lib/family/types";

/** Given name and surname, falling back to the raw slashed GEDCOM name. */
export function formatName(member: FamilyMember): string {
	const parts = [member.given_name, member.surname].filter(Boolean).join(" ");
	if (parts.trim()) return parts.trim();

	return member.name.replace(/\//g, " ").replace(/\s+/g, " ").trim();
}

/** The first four-or-three digit year in a GEDCOM date, if there is one. */
export function formatYear(event: LifeEvent | undefined): string | undefined {
	const raw = event?.date?.raw;
	if (!raw) return undefined;

	return /\d{3,4}/.exec(raw)?.[0];
}

/** Life span as `1890 – 1962`, `1890 –` or `– 1962`; empty when unknown. */
export function formatLifespan(member: FamilyMember): string {
	const birth = formatYear(member.birth);
	const death = formatYear(member.death);

	if (!birth && !death) return "";
	if (birth && !death) return `${birth} –`;
	if (!birth && death) return `– ${death}`;

	return `${birth} – ${death}`;
}
