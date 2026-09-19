import { doc, getDoc, getFirestore } from "firebase/firestore";
import type { FamilyData } from "lib/family/types";
import { assertFamilyData } from "lib/family/validation";

const FAMILY_TREE_COLLECTION = "familyTrees";
const FAMILY_TREE_DOCUMENT = "beltrami";

/**
 * Gets the document reference for a user's family tree
 * @returns The Firestore document reference for the family tree
 */
function getFamilyTreeRef() {
	// Resolved lazily: the Firebase app is initialised by `lib/auth`, so asking
	// for Firestore at import time would depend on module evaluation order.
	return doc(getFirestore(), FAMILY_TREE_COLLECTION, FAMILY_TREE_DOCUMENT);
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

		assertFamilyData(data, `${FAMILY_TREE_COLLECTION}/${FAMILY_TREE_DOCUMENT}`);

		return data;
	} catch (error) {
		console.error("Error fetching family tree data:", error);
		throw error;
	}
}
