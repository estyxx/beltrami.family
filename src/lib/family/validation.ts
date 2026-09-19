/**
 * Validation for family tree data. Whatever the source (Firestore, a local
 * Rootsy export, the API route), the data is untrusted at runtime and has to
 * be checked rather than cast.
 *
 * Checking collects every problem with the path that has it, so a bad export
 * says which individual and which field to look at. Messages name types only,
 * never the offending value: these errors reach logs and the API response, and
 * the data is private.
 */

import type { FamilyData } from "lib/family/types";

/** One shape problem: where it is, and what was expected there. */
export type ValidationIssue = {
	/** Dotted path into the data, e.g. `individuals["@I12@"].birth.date.raw`. */
	path: string;
	message: string;
};

/** Enough kinds of problem to work from without flooding the log. */
const MAX_REPORTED_KINDS = 10;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The kind of a value, for an error message: never the value itself. */
function describeType(value: unknown): string {
	if (value === null) return "null";
	if (value === undefined) return "nothing";
	if (Array.isArray(value)) return "an array";
	if (isRecord(value)) return "an object";

	return `a ${typeof value}`;
}

function checkString(
	issues: ValidationIssue[],
	path: string,
	value: unknown,
): void {
	if (typeof value === "string") return;

	issues.push({
		path,
		message: `expected a string, got ${describeType(value)}`,
	});
}

/** Optional fields are absent as `undefined` or, from Rootsy, as `null`. */
function isAbsent(value: unknown): boolean {
	return value === undefined || value === null;
}

function checkOptionalString(
	issues: ValidationIssue[],
	path: string,
	value: unknown,
): void {
	if (isAbsent(value)) return;

	checkString(issues, path, value);
}

function checkStringArray(
	issues: ValidationIssue[],
	path: string,
	value: unknown,
): void {
	if (!Array.isArray(value)) {
		issues.push({
			path,
			message: `expected an array of strings, got ${describeType(value)}`,
		});
		return;
	}

	value.forEach((item, index) => {
		checkString(issues, `${path}[${index}]`, item);
	});
}

/**
 * A life event is optional, and so is its date; when present the raw GEDCOM
 * string is what we render.
 */
function checkLifeEvent(
	issues: ValidationIssue[],
	path: string,
	value: unknown,
): void {
	if (isAbsent(value)) return;

	if (!isRecord(value)) {
		issues.push({
			path,
			message: `expected an event object, got ${describeType(value)}`,
		});
		return;
	}

	if (isAbsent(value.date)) return;

	if (!isRecord(value.date)) {
		issues.push({
			path: `${path}.date`,
			message: `expected a date object, got ${describeType(value.date)}`,
		});
		return;
	}

	checkString(issues, `${path}.date.raw`, value.date.raw);
}

function checkFamilyMember(
	issues: ValidationIssue[],
	path: string,
	value: unknown,
): void {
	if (!isRecord(value)) {
		issues.push({
			path,
			message: `expected an individual object, got ${describeType(value)}`,
		});
		return;
	}

	checkString(issues, `${path}.id`, value.id);
	checkString(issues, `${path}.name`, value.name);
	checkOptionalString(issues, `${path}.given_name`, value.given_name);
	checkOptionalString(issues, `${path}.surname`, value.surname);
	checkOptionalString(issues, `${path}.sex`, value.sex);
	checkLifeEvent(issues, `${path}.birth`, value.birth);
	checkLifeEvent(issues, `${path}.death`, value.death);
	checkStringArray(
		issues,
		`${path}.child_of_families`,
		value.child_of_families,
	);
	checkStringArray(
		issues,
		`${path}.spouse_in_families`,
		value.spouse_in_families,
	);
}

function checkFamily(
	issues: ValidationIssue[],
	path: string,
	value: unknown,
): void {
	if (!isRecord(value)) {
		issues.push({
			path,
			message: `expected a family object, got ${describeType(value)}`,
		});
		return;
	}

	checkString(issues, `${path}.id`, value.id);
	checkOptionalString(issues, `${path}.husband`, value.husband);
	checkOptionalString(issues, `${path}.wife`, value.wife);
	checkStringArray(issues, `${path}.children`, value.children);
}

/**
 * Every shape problem in `data`, in document order.
 * @param data - The raw data, from Firestore or a JSON export
 * @returns The problems found; an empty list means the data is `FamilyData`
 */
export function collectFamilyDataIssues(data: unknown): ValidationIssue[] {
	const issues: ValidationIssue[] = [];

	if (!isRecord(data)) {
		issues.push({
			path: "",
			message: `expected an object with individuals and families, got ${describeType(data)}`,
		});
		return issues;
	}

	if (isRecord(data.individuals)) {
		for (const [id, member] of Object.entries(data.individuals)) {
			checkFamilyMember(issues, `individuals[${JSON.stringify(id)}]`, member);
		}
	} else {
		issues.push({
			path: "individuals",
			message: `expected an object keyed by GEDCOM xref, got ${describeType(data.individuals)}`,
		});
	}

	if (isRecord(data.families)) {
		for (const [id, family] of Object.entries(data.families)) {
			checkFamily(issues, `families[${JSON.stringify(id)}]`, family);
		}
	} else {
		issues.push({
			path: "families",
			message: `expected an object keyed by GEDCOM xref, got ${describeType(data.families)}`,
		});
	}

	return issues;
}

/**
 * The same problem on 20 individuals is one thing to fix, so identical problems
 * are reported once with a count and an example, not twenty times.
 */
function groupKey(issue: ValidationIssue): string {
	const shape = issue.path
		.replace(/\["[^"]*"\]/g, "[*]")
		.replace(/\[\d+\]/g, "[*]");

	return `${shape}: ${issue.message}`;
}

/** The problems as one indented line per kind, capped so a log stays readable. */
export function describeValidationIssues(issues: ValidationIssue[]): string {
	const kinds = new Map<string, ValidationIssue[]>();
	for (const issue of issues) {
		const key = groupKey(issue);
		const group = kinds.get(key);
		if (group) group.push(issue);
		else kinds.set(key, [issue]);
	}

	const lines = Array.from(kinds.values())
		.slice(0, MAX_REPORTED_KINDS)
		.map((group) => describeGroup(group));

	const hidden = kinds.size - lines.length;
	if (hidden > 0) lines.push(`  ...and ${hidden} more kinds of problem`);

	return lines.join("\n");
}

function describeGroup(group: ValidationIssue[]): string {
	// The group always holds at least the issue that created it.
	const [first] = group;
	const where = first.path ? `${first.path}: ` : "";

	if (group.length === 1) return `  ${where}${first.message}`;

	const shape = groupKey(first);

	return `  ${shape} (${group.length} times, e.g. ${first.path})`;
}

/**
 * Type guard to verify the shape of the family tree data
 * @param data - The raw data, from Firestore or a JSON export
 * @returns A boolean indicating whether the data matches our expected structure
 */
export function isValidFamilyData(data: unknown): data is FamilyData {
	return collectFamilyDataIssues(data).length === 0;
}

/**
 * Narrows `data` to `FamilyData`, or throws naming every problem found.
 * @param data - The raw data, from Firestore or a JSON export
 * @param source - Where the data came from, for the error message
 * @throws Will throw if the data does not match our expected structure
 */
export function assertFamilyData(
	data: unknown,
	source: string,
): asserts data is FamilyData {
	const issues = collectFamilyDataIssues(data);
	if (issues.length === 0) return;

	const count = issues.length === 1 ? "1 problem" : `${issues.length} problems`;

	throw new Error(
		`Invalid family tree data in ${source} (${count}):\n${describeValidationIssues(issues)}`,
	);
}
