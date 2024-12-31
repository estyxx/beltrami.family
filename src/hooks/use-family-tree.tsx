"use client";
import type { FamilyData } from "app/family-tree/types";
import { useAuth } from "contexts/user-context";
import { getFamilyTreeData } from "lib/firestore";
import { useEffect, useState } from "react";

export function useFamilyTree() {
	const { user, loading: authLoading } = useAuth();
	const [familyData, setFamilyData] = useState<FamilyData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		if (authLoading) return;
		if (!user) {
			setLoading(false);
			return;
		}

		const fetchFamilyData = async () => {
			try {
				setLoading(true);
				setError(null);
				const data = await getFamilyTreeData();
				setFamilyData(data);
			} catch (err) {
				setError(
					err instanceof Error ? err : new Error("Failed to fetch family data"),
				);
			} finally {
				setLoading(false);
			}
		};

		fetchFamilyData();
	}, [user, authLoading]);

	return {
		familyData,
		loading,
		error,
	};
}
