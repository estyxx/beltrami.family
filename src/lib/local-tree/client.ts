import type { FamilyData } from "lib/family/types";
import { assertFamilyData } from "lib/family/validation";

/**
 * Fetches the family tree from the local JSON export, through the API route
 * that reads it on the server.
 * @returns A promise that resolves to the family tree data
 * @throws Will throw if the route fails or returns something unexpected
 */
export async function getLocalFamilyTreeData(): Promise<FamilyData | null> {
	const response = await fetch("/api/family-tree");

	if (!response.ok) {
		throw new Error(
			`Failed to load local family data (${response.status} ${response.statusText})`,
		);
	}

	const data: unknown = await response.json();

	assertFamilyData(data, "/api/family-tree");

	return data;
}
