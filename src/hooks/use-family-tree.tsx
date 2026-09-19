"use client";
import { useAuth } from "contexts/user-context";
import { usesLocalFamilyData } from "helpers/config";
import type { FamilyData } from "lib/family/types";
import { getFamilyTreeData } from "lib/firestore";
import { getLocalFamilyTreeData } from "lib/local-tree/client";
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
				// A local Rootsy export wins over Firestore when one is configured.
				const data = usesLocalFamilyData
					? await getLocalFamilyTreeData()
					: await getFamilyTreeData();
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
