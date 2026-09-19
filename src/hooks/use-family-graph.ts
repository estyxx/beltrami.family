"use client";
import { layoutWithElk } from "lib/family/elk-layout";
import {
	EMPTY_FAMILY_DATA,
	type FocusOptions,
	selectRelatives,
} from "lib/family/focus";
import { buildGraph, EMPTY_GRAPH, type FamilyGraph } from "lib/family/layout";
import type { FamilyData } from "lib/family/types";
import { useEffect, useMemo, useState } from "react";

/**
 * Turns the tree around one person into a React Flow graph.
 *
 * The generational grid from `buildGraph` shows first and is replaced by the
 * elk layout once it resolves, because elk only runs asynchronously.
 *
 * @param familyData - The whole tree
 * @param focusId - The person the view is built around
 * @param options - How far the view reaches in each direction
 */
export function useFamilyGraph(
	familyData: FamilyData | null,
	focusId: string | null,
	options: FocusOptions,
): FamilyGraph {
	const visible = useMemo(() => {
		if (!familyData) return EMPTY_FAMILY_DATA;
		if (!focusId) return familyData;

		return selectRelatives(familyData, focusId, options);
	}, [familyData, focusId, options]);

	const grid = useMemo(
		() => (visible === EMPTY_FAMILY_DATA ? EMPTY_GRAPH : buildGraph(visible)),
		[visible],
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
