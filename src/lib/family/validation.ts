/**
 * Type guards for family tree data. Whatever the source (Firestore, a local
 * Rootsy export, the API route), the data is untrusted at runtime and has to
 * be checked rather than cast.
 */

import type { FamilyData, FamilyMember } from "lib/family/types";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((it) => typeof it === "string");
}

function isOptionalString(value: unknown): value is string | undefined {
	return value === undefined || typeof value === "string";
}

/**
 * A life event is optional, and so is its date; when present the raw GEDCOM
 * string is what we render.
 */
function isValidLifeEvent(value: unknown): boolean {
	if (value === undefined) return true;
	if (!isRecord(value)) return false;
	if (value.date === undefined) return true;

	return isRecord(value.date) && typeof value.date.raw === "string";
}

function isValidFamilyMember(value: unknown): value is FamilyMember {
	if (!isRecord(value)) return false;

	return (
		typeof value.id === "string" &&
		typeof value.name === "string" &&
		isOptionalString(value.given_name) &&
		isOptionalString(value.surname) &&
		isOptionalString(value.sex) &&
		isValidLifeEvent(value.birth) &&
		isValidLifeEvent(value.death) &&
		isStringArray(value.child_of_families) &&
		isStringArray(value.spouse_in_families)
	);
}

function isValidFamily(value: unknown): boolean {
	if (!isRecord(value)) return false;

	return (
		typeof value.id === "string" &&
		isOptionalString(value.husband) &&
		isOptionalString(value.wife) &&
		isStringArray(value.children)
	);
}

/**
 * Type guard to verify the shape of the family tree data
 * @param data - The raw data, from Firestore or a JSON export
 * @returns A boolean indicating whether the data matches our expected structure
 */
export function isValidFamilyData(data: unknown): data is FamilyData {
	if (!isRecord(data)) return false;
	if (!isRecord(data.individuals) || !isRecord(data.families)) return false;

	return (
		Object.values(data.individuals).every(isValidFamilyMember) &&
		Object.values(data.families).every(isValidFamily)
	);
}
