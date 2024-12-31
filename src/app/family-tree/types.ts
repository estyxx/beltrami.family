export type FamilyMember = {
	id: string;
	name: string;
	given_name?: string;
	surname?: string;
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
			husband?: string;
			wife?: string;
			children: string[];
		}
	>;
};
