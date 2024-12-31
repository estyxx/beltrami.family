export type FamilyMember = {
	id: string;
	name: string;
	birthDate?: string;
	deathDate?: string;
	sex?: string;
};

export type FamilyData = {
	individuals: Record<string, FamilyMember>;
	families: Record<
		string,
		{
			id: string;
			husbandId?: string;
			wifeId?: string;
			childrenIds: string[];
		}
	>;
};
