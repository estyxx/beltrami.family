"use client";
import { layoutWithElk } from "lib/family/elk-layout";
import { EMPTY_GRAPH, type FamilyGraph, buildGraph } from "lib/family/layout";
import type { FamilyData } from "lib/family/types";
import { useEffect, useMemo, useState } from "react";

/**
 * Turns family data into a React Flow graph. The generational grid from
 * `buildGraph` shows first and is replaced by the elk layout once it resolves,
 * because elk only runs asynchronously.
 */
export function useFamilyGraph(familyData: FamilyData | null): FamilyGraph {
	const grid = useMemo(
		() => (familyData ? buildGraph(familyData) : EMPTY_GRAPH),
		[familyData],
	);
	const [graph, setGraph] = useState<FamilyGraph>(grid);

	useEffect(() => {
		let cancelled = false;
		setGraph(grid);

		layoutWithElk(grid)
			.then((laidOut) => {
				if (!cancelled) setGraph(laidOut);
			})
			.catch((error) => {
				// The grid stays on screen, so the tree is still readable.
				console.error("Elk layout failed:", error);
			});

		return () => {
			cancelled = true;
		};
	}, [grid]);

	return graph;
}
