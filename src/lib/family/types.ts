/**
 * Domain types for the family tree, shared by the app and the upload script.
 * They mirror the JSON that Rootsy emits from a GEDCOM export; keep them in
 * sync with the parser rather than duplicating them elsewhere.
 */

/**
 * A GEDCOM date. Dates can be qualified (`ABT 1890`, `BET 1900 AND 1910`), so
 * the raw string is what we display.
 */
export type GedcomDate = {
	raw: string;
};

/** A dated life event (`BIRT`, `DEAT`) attached to an individual. */
export type LifeEvent = {
	date?: GedcomDate | null;
};

/**
 * Represents a single member in the family tree, keyed in `FamilyData` by its
 * GEDCOM xref (e.g. `@I12@`).
 */
export type FamilyMember = {
	id: string;
	/** Raw GEDCOM name, `Given /Surname/`. Render `given_name`/`surname`. */
	name: string;
	/**
	 * Optional fields arrive as `null` when Rootsy has nothing for them, because
	 * an empty GEDCOM name part (`Deanna //`) is valid. Treat `null` as absent.
	 */
	given_name?: string | null;
	surname?: string | null;
	sex?: string | null;
	birth?: LifeEvent | null;
	death?: LifeEvent | null;
	/** `FAMC`: families this individual is a child of. */
	child_of_families: string[];
	/** `FAMS`: families this individual is a partner in. */
	spouse_in_families: string[];
};

/** A GEDCOM `FAM` record: two partners and their children. */
export type Family = {
	id: string;
	husband?: string | null;
	wife?: string | null;
	children: string[];
};

/** Represents the complete family tree data structure. */
export type FamilyData = {
	individuals: Record<string, FamilyMember>;
	families: Record<string, Family>;
};
