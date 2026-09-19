import { pickDefaultFocus, selectRelatives } from "lib/family/focus";
import type { FamilyData, FamilyMember } from "lib/family/types";

function member(
	id: string,
	childOf: string[],
	spouseIn: string[],
): FamilyMember {
	return {
		id,
		name: `Person${id} /Test/`,
		given_name: `Person${id}`,
		surname: "Test",
		child_of_families: childOf,
		spouse_in_families: spouseIn,
	};
}

/**
 * Four generations with a cousin branch and an unrelated family:
 *
 *   @I1@ + @I2@ ─┬─ @I3@ + @I5@ ─┬─ @I6@ (focus) + @I10@ ── @I11@ ── @I12@
 *                │               └─ @I7@ (sibling)
 *                └─ @I4@ + @I8@ ─── @I9@ (cousin)
 *
 *   @I90@ + @I91@ ── @I92@   (no connection to the rest)
 */
function tree(): FamilyData {
	return {
		individuals: {
			"@I1@": member("@I1@", [], ["@F1@"]),
			"@I2@": member("@I2@", [], ["@F1@"]),
			"@I3@": member("@I3@", ["@F1@"], ["@F2@"]),
			"@I4@": member("@I4@", ["@F1@"], ["@F3@"]),
			"@I5@": member("@I5@", [], ["@F2@"]),
			"@I6@": member("@I6@", ["@F2@"], ["@F4@"]),
			"@I7@": member("@I7@", ["@F2@"], []),
			"@I8@": member("@I8@", [], ["@F3@"]),
			"@I9@": member("@I9@", ["@F3@"], []),
			"@I10@": member("@I10@", [], ["@F4@"]),
			"@I11@": member("@I11@", ["@F4@"], ["@F5@"]),
			"@I12@": member("@I12@", ["@F5@"], []),
			"@I90@": member("@I90@", [], ["@F9@"]),
			"@I91@": member("@I91@", [], ["@F9@"]),
			"@I92@": member("@I92@", ["@F9@"], []),
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
			"@F3@": { id: "@F3@", husband: "@I4@", wife: "@I8@", children: ["@I9@"] },
			"@F4@": {
				id: "@F4@",
				husband: "@I6@",
				wife: "@I10@",
				children: ["@I11@"],
			},
			"@F5@": { id: "@F5@", husband: "@I11@", children: ["@I12@"] },
			"@F9@": {
				id: "@F9@",
				husband: "@I90@",
				wife: "@I91@",
				children: ["@I92@"],
			},
		},
	};
}

function ids(data: FamilyData): string[] {
	return Object.keys(data.individuals).sort();
}

describe("selectRelatives", () => {
	it("keeps the close family one generation out", () => {
		const selected = selectRelatives(tree(), "@I6@", {
			ancestors: 1,
			descendants: 1,
		});

		expect(ids(selected)).toEqual([
			"@I10@", // partner
			"@I11@", // child
			"@I3@", // father
			"@I5@", // mother
			"@I6@", // focus
			"@I7@", // sibling, through the father
		]);
	});

	it("reaches cousins once grandparents are included", () => {
		const selected = selectRelatives(tree(), "@I6@", {
			ancestors: 2,
			descendants: 1,
		});

		// Grandparents, the uncle and his wife, and the cousin below them.
		expect(ids(selected)).toEqual(
			expect.arrayContaining(["@I1@", "@I2@", "@I4@", "@I8@", "@I9@"]),
		);
	});

	it("leaves out the side branches when collateral is off", () => {
		const selected = selectRelatives(tree(), "@I6@", {
			ancestors: 2,
			descendants: 2,
			collateral: false,
		});

		expect(ids(selected)).toEqual([
			"@I10@",
			"@I11@",
			"@I12@",
			"@I1@",
			"@I2@",
			"@I3@",
			"@I5@",
			"@I6@",
		]);
		expect(ids(selected)).not.toContain("@I7@");
		expect(ids(selected)).not.toContain("@I9@");
	});

	it("never reaches an unconnected family", () => {
		const selected = selectRelatives(tree(), "@I6@", {
			ancestors: 9,
			descendants: 9,
		});

		expect(ids(selected)).not.toContain("@I90@");
		expect(Object.keys(selected.families)).not.toContain("@F9@");
	});

	it("drops a family that lost all but one of its members", () => {
		const selected = selectRelatives(tree(), "@I6@", {
			ancestors: 0,
			descendants: 0,
			collateral: false,
		});

		// The focus and their partner, so only the family they share is worth drawing.
		expect(ids(selected)).toEqual(["@I10@", "@I6@"]);
		expect(Object.keys(selected.families)).toEqual(["@F4@"]);
	});

	it("returns nothing for an unknown person", () => {
		expect(selectRelatives(tree(), "@nobody@")).toEqual({
			individuals: {},
			families: {},
		});
	});
});

describe("pickDefaultFocus", () => {
	it("picks whoever has the most descendants", () => {
		expect(pickDefaultFocus(tree())).toBe("@I1@");
	});

	it("has nothing to pick in an empty tree", () => {
		expect(pickDefaultFocus({ individuals: {}, families: {} })).toBeUndefined();
	});
});
