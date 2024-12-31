"use client";
import { useFamilyTree } from "hooks/use-family-tree";
import type { FC } from "react";

const FamilyTree: FC = () => {
	const { familyData, loading, error } = useFamilyTree();

	if (loading) {
		return <div>Loading family tree...</div>;
	}

	if (error) {
		return <div>Error loading family tree: {error.message}</div>;
	}

	if (!familyData) {
		return <div>No family tree data available</div>;
	}

	return (
		<div>
			{Object.values(familyData.individuals).map((member) => (
				<div key={member.id}>{member.name}</div>
			))}
		</div>
	);
};
export default FamilyTree;
