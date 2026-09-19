import { readFile } from "node:fs/promises";
import path from "node:path";

import { localFamilyDataPath } from "helpers/config";
import type { FamilyData } from "lib/family/types";
import { assertFamilyData } from "lib/family/validation";

/**
 * Reads the Rootsy JSON export pointed at by `NEXT_PUBLIC_LOCAL_FAMILY_DATA_PATH`.
 * Node only: it is imported by the `/api/family-tree` route handler, never by
 * client code, so the file never reaches the browser bundle.
 *
 * @returns The family tree data held in the local export
 * @throws Will throw if no file is configured, or if it cannot be read or parsed
 */
export async function readLocalFamilyData(): Promise<FamilyData> {
	if (!localFamilyDataPath) {
		throw new Error("No local family data file is configured");
	}

	// The path is configuration, not an import: tell Turbopack not to trace
	// the whole project trying to resolve it into the server bundle.
	const absolutePath = path.resolve(
		/* turbopackIgnore: true */ process.cwd(),
		localFamilyDataPath,
	);
	let data: unknown;

	try {
		data = JSON.parse(await readFile(absolutePath, "utf8"));
	} catch (error) {
		throw new Error(
			`Failed to read ${localFamilyDataPath}: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}

	assertFamilyData(data, localFamilyDataPath);

	return data;
}
