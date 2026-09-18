import type { Firestore } from "firebase/firestore";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import type { FamilyData, FamilyMember } from "lib/family/types";

// Initialize Firestore once as a module-level constant
const db: Firestore = getFirestore();

/**
 * Gets the document reference for a user's family tree
 * @returns The Firestore document reference for the family tree
 */
function getFamilyTreeRef() {
	return doc(db, "familyTrees", "beltrami");
}

/**
 * Fetches the family tree data for a specific user
 * @returns A promise that resolves to the family tree data or null if not found
 * @throws Will throw an error if the database operation fails
 */
export async function getFamilyTreeData(): Promise<FamilyData | null> {
	try {
		const docRef = getFamilyTreeRef();
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) {
			console.warn("No family tree data found");
			return null;
		}

		const data = docSnap.data();

		if (!isValidFamilyData(data)) {
			throw new Error("Invalid family tree data structure");
		}

		return data;
	} catch (error) {
		console.error("Error fetching family tree data:", error);
		throw error;
	}
}

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
 * @param data - The raw data from Firestore
 * @returns A boolean indicating whether the data matches our expected structure
 */
function isValidFamilyData(data: unknown): data is FamilyData {
	if (!isRecord(data)) return false;
	if (!isRecord(data.individuals) || !isRecord(data.families)) return false;

	return (
		Object.values(data.individuals).every(isValidFamilyMember) &&
		Object.values(data.families).every(isValidFamily)
	);
}
