import { buildGraph, junctionId } from "lib/family/layout";
import type { FamilyData, FamilyMember } from "lib/family/types";

function member(
	id: string,
	given: string,
	surname: string,
	sex: string,
	childOf: string[],
	spouseIn: string[],
): FamilyMember {
	return {
		id,
		name: `${given} /${surname}/`,
		given_name: given,
		surname,
		sex,
		child_of_families: childOf,
		spouse_in_families: spouseIn,
	};
}

/**
 * Three generations: a founding couple, their two children, and the family one
 * of those children starts with a partner who married in.
 */
function threeGenerations(): FamilyData {
	return {
		individuals: {
			"@I1@": member("@I1@", "Giuseppe", "Beltrami", "M", [], ["@F1@"]),
			"@I2@": member("@I2@", "Maria", "Rossi", "F", [], ["@F1@"]),
			"@I3@": member("@I3@", "Carlo", "Beltrami", "M", ["@F1@"], ["@F2@"]),
			"@I4@": member("@I4@", "Anna", "Beltrami", "F", ["@F1@"], []),
			"@I5@": member("@I5@", "Deanna", "", "F", [], ["@F2@"]),
			"@I6@": member("@I6@", "Luca", "Beltrami", "M", ["@F2@"], []),
			"@I7@": member("@I7@", "Sofia", "Beltrami", "F", ["@F2@"], []),
		},
		families: {
			"@F1@": {
				id: "@F1@",
				husband: "@I1@",
				wife: "@I2@",
				children: ["@I3@", "@I4@"],
			},
			"@F2@": {
				id: "@F2@",
				husband: "@I3@",
				wife: "@I5@",
				children: ["@I6@", "@I7@"],
			},
		},
	};
}

const PARTNER_COUNT = 4;
const CHILD_COUNT = 4;

function personNodes(data: FamilyData) {
	return buildGraph(data).nodes.filter((node) => node.type === "person");
}

describe("buildGraph", () => {
	it("creates one node per individual and one junction per family", () => {
		const data = threeGenerations();
		const { nodes } = buildGraph(data);

		expect(nodes.filter((node) => node.type === "person")).toHaveLength(
			Object.keys(data.individuals).length,
		);
		expect(nodes.filter((node) => node.type === "family")).toHaveLength(
			Object.keys(data.families).length,
		);
		expect(nodes.map((node) => node.id)).toEqual(
			expect.arrayContaining(["@I7@", junctionId("@F2@")]),
		);
	});

	it("creates one edge per partner and per child", () => {
		const { edges } = buildGraph(threeGenerations());

		expect(edges).toHaveLength(PARTNER_COUNT + CHILD_COUNT);
		expect(edges.every((edge) => edge.type === "smoothstep")).toBe(true);
		expect(edges.every((edge) => edge.label === undefined)).toBe(true);
	});

	it("links a child to its family once, not to each parent", () => {
		const { edges } = buildGraph(threeGenerations());
		const intoChild = edges.filter((edge) => edge.target === "@I6@");

		expect(intoChild).toHaveLength(1);
		expect(intoChild[0].source).toBe(junctionId("@F2@"));
	});

	it("points partners at their family junction", () => {
		const { edges } = buildGraph(threeGenerations());
		const intoJunction = edges.filter(
			(edge) => edge.target === junctionId("@F2@"),
		);

		expect(intoJunction.map((edge) => edge.source).sort()).toEqual([
			"@I3@",
			"@I5@",
		]);
	});

	it("puts every child one generation below its parents", () => {
		const nodes = personNodes(threeGenerations());
		const generation = (id: string) => {
			const node = nodes.find((item) => item.id === id);
			if (!node || node.type !== "person") throw new Error(`missing ${id}`);
			return node.data.generation;
		};

		expect(generation("@I1@")).toBe(0);
		expect(generation("@I2@")).toBe(0);
		expect(generation("@I3@")).toBe(1);
		expect(generation("@I4@")).toBe(1);
		// Married in with no parents of her own, she still shares Carlo's row.
		expect(generation("@I5@")).toBe(1);
		expect(generation("@I6@")).toBe(2);
		expect(generation("@I7@")).toBe(2);
	});

	it("places later generations further down", () => {
		const data = threeGenerations();
		const nodes = personNodes(data);
		const positionOf = (id: string) => {
			const node = nodes.find((item) => item.id === id);
			if (!node) throw new Error(`missing ${id}`);
			return node.position;
		};

		for (const family of Object.values(data.families)) {
			const parents = [family.husband, family.wife].filter(
				(id): id is string => id !== undefined,
			);

			for (const childId of family.children) {
				for (const parentId of parents) {
					expect(positionOf(childId).y).toBeGreaterThan(positionOf(parentId).y);
				}
			}
		}
	});

	it("never overlaps two nodes", () => {
		const { nodes } = buildGraph(threeGenerations());

		for (const node of nodes) {
			for (const other of nodes) {
				if (node.id === other.id) continue;

				const overlaps =
					node.position.x < other.position.x + (other.width ?? 0) &&
					node.position.x + (node.width ?? 0) > other.position.x &&
					node.position.y < other.position.y + (other.height ?? 0) &&
					node.position.y + (node.height ?? 0) > other.position.y;

				expect(overlaps).toBe(false);
			}
		}
	});

	it("returns an empty graph for empty data", () => {
		expect(buildGraph({ individuals: {}, families: {} })).toEqual({
			nodes: [],
			edges: [],
		});
	});
});
