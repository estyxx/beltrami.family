// scripts/utils/file-utils.ts

import * as fs from "node:fs";
import * as path from "node:path";
import type { FamilyData } from "../types";

/**
 * Reads and parses a JSON file containing family tree data
 * @param filePath - Path to the JSON file
 * @returns Parsed family tree data
 * @throws Error if file doesn't exist or is invalid
 */
export function readFamilyTreeFile(filePath: string): FamilyData {
	const absolutePath = path.resolve(process.cwd(), filePath);

	if (!fs.existsSync(absolutePath)) {
		throw new Error(`File not found: ${absolutePath}`);
	}

	try {
		const rawData = fs.readFileSync(absolutePath, "utf8");
		return JSON.parse(rawData) as FamilyData;
	} catch (error) {
		throw new Error(
			`Failed to parse family tree file: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/**
 * Extracts document ID from file path
 * @param filePath - Path to the file
 * @returns Document ID derived from filename
 */
export function getDocumentId(filePath: string): string {
	return path.basename(filePath, path.extname(filePath));
}
