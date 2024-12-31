/**
 * Represents a single member in the family tree
 */
export type FamilyMember = {
	id: string;
	name: string;
	given_name?: string;
	birthDate?: string;
	deathDate?: string;
	sex?: string;
	families: string[];
};

/**
 * Represents the complete family tree data structure
 */
export type FamilyData = {
	individuals: Record<string, FamilyMember>;
	families: Record<
		string,
		{
			id: string;
			husband?: string;
			wife?: string;
			children: string[];
		}
	>;
};
