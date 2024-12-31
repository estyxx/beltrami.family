import type { FamilyData } from "app/family-tree/types";
import type { DocumentData, Firestore } from "firebase/firestore";
import { doc, getDoc, getFirestore } from "firebase/firestore";

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
		console.log(docRef);
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) {
			console.warn("No family tree data found");
			return null;
		}

		// Type assertion here is necessary as Firestore doesn't know our data structure
		const data = docSnap.data() as DocumentData;

		// Add runtime type checking if needed
		// This is optional but adds an extra layer of safety
		if (!isValidFamilyData(data)) {
			throw new Error("Invalid family tree data structure");
		}

		return data as FamilyData;
	} catch (error) {
		console.error("Error fetching family tree data:", error);
		throw error;
	}
}

/**
 * Type guard to verify the shape of the family tree data
 * @param data - The raw data from Firestore
 * @returns A boolean indicating whether the data matches our expected structure
 */
function isValidFamilyData(data: unknown): data is FamilyData {
	if (!data || typeof data !== "object") return false;

	const candidate = data as Record<string, unknown>;

	return (
		"individuals" in candidate &&
		"families" in candidate &&
		typeof candidate.individuals === "object" &&
		typeof candidate.families === "object"
	);
}
