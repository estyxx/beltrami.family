import { NextResponse } from "next/server";

import { localFamilyDataPath } from "helpers/config";
import { readLocalFamilyData } from "lib/local-tree/server";

/** The export is read from disk on every request, so never cache it. */
export const dynamic = "force-dynamic";

/**
 * Serves the local Rootsy export to the tree canvas. Disabled unless
 * `NEXT_PUBLIC_LOCAL_FAMILY_DATA_PATH` is set, which is a local-development
 * switch: deployments leave it unset and read from Firestore instead.
 */
export async function GET() {
	if (!localFamilyDataPath) {
		return NextResponse.json(
			{ error: "No local family data file is configured" },
			{ status: 404 },
		);
	}

	try {
		return NextResponse.json(await readLocalFamilyData());
	} catch (error) {
		console.error("Error reading local family data:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Failed to read local family data",
			},
			{ status: 500 },
		);
	}
}
