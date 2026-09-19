import type { FamilyData } from "lib/family/types";
import {
	assertFamilyData,
	collectFamilyDataIssues,
	isValidFamilyData,
} from "lib/family/validation";

const valid: FamilyData = {
	individuals: {
		"@I1@": {
			id: "@I1@",
			name: "Giuseppe /Beltrami/",
			given_name: "Giuseppe",
			surname: "Beltrami",
			sex: "M",
			birth: { date: { raw: "ABT 1890" } },
			child_of_families: [],
			spouse_in_families: ["@F1@"],
		},
	},
	families: {
		"@F1@": { id: "@F1@", husband: "@I1@", children: [] },
	},
};

function clone(): Record<string, unknown> {
	return JSON.parse(JSON.stringify(valid));
}

describe("collectFamilyDataIssues", () => {
	it("finds nothing wrong with valid data", () => {
		expect(collectFamilyDataIssues(valid)).toEqual([]);
		expect(isValidFamilyData(valid)).toBe(true);
	});

	it("names the individual and the field that is wrong", () => {
		const data = clone();
		// biome-ignore lint/suspicious/noExplicitAny: shaping deliberately bad data
		(data.individuals as any)["@I1@"].name = 42;

		expect(collectFamilyDataIssues(data)).toEqual([
			{
				path: 'individuals["@I1@"].name',
				message: "expected a string, got a number",
			},
		]);
	});

	it("reaches into a life event date", () => {
		const data = clone();
		// biome-ignore lint/suspicious/noExplicitAny: shaping deliberately bad data
		(data.individuals as any)["@I1@"].birth.date.raw = null;

		expect(collectFamilyDataIssues(data)).toEqual([
			{
				path: 'individuals["@I1@"].birth.date.raw',
				message: "expected a string, got null",
			},
		]);
	});

	it("points at the element of a string array", () => {
		const data = clone();
		// biome-ignore lint/suspicious/noExplicitAny: shaping deliberately bad data
		(data.families as any)["@F1@"].children = ["@I2@", 7];

		expect(collectFamilyDataIssues(data)).toEqual([
			{
				path: 'families["@F1@"].children[1]',
				message: "expected a string, got a number",
			},
		]);
	});

	it("reports a missing top level key", () => {
		expect(collectFamilyDataIssues({ individuals: {} })).toEqual([
			{
				path: "families",
				message: "expected an object keyed by GEDCOM xref, got nothing",
			},
		]);
	});

	it("reports data that is not an object at all", () => {
		expect(collectFamilyDataIssues(null)).toEqual([
			{
				path: "",
				message: "expected an object with individuals and families, got null",
			},
		]);
	});

	it("collects every problem, not just the first", () => {
		const data = clone();
		// biome-ignore lint/suspicious/noExplicitAny: shaping deliberately bad data
		const member = (data.individuals as any)["@I1@"];
		member.id = 1;
		member.sex = false;
		member.child_of_families = "@F2@";

		expect(collectFamilyDataIssues(data).map((issue) => issue.path)).toEqual([
			'individuals["@I1@"].id',
			'individuals["@I1@"].sex',
			'individuals["@I1@"].child_of_families',
		]);
	});
});

describe("assertFamilyData", () => {
	it("passes valid data through", () => {
		expect(() => assertFamilyData(valid, "test")).not.toThrow();
	});

	it("names the source, the count and every problem", () => {
		const data = clone();
		// biome-ignore lint/suspicious/noExplicitAny: shaping deliberately bad data
		const member = (data.individuals as any)["@I1@"];
		member.name = 42;
		member.surname = [];

		expect(() => assertFamilyData(data, "data/beltrami.json")).toThrow(
			[
				"Invalid family tree data in data/beltrami.json (2 problems):",
				'  individuals["@I1@"].name: expected a string, got a number',
				'  individuals["@I1@"].surname: expected a string, got an array',
			].join("\n"),
		);
	});

	it("caps the list and counts the rest", () => {
		const individuals: Record<string, unknown> = {};
		for (let index = 0; index < 12; index++) {
			individuals[`@I${index}@`] = "not an individual";
		}

		expect(() =>
			assertFamilyData({ individuals, families: {} }, "big.json"),
		).toThrow(/\(12 problems\)/);
		expect(() =>
			assertFamilyData({ individuals, families: {} }, "big.json"),
		).toThrow(/\n {2}\.\.\.and 2 more$/);
	});

	it("never repeats the offending value", () => {
		const data = clone();
		// biome-ignore lint/suspicious/noExplicitAny: shaping deliberately bad data
		(data.individuals as any)["@I1@"].name = { secret: "Nonna Pina" };

		expect(() => assertFamilyData(data, "test")).toThrow(
			/expected a string, got an object/,
		);
		expect(() => assertFamilyData(data, "test")).not.toThrow(/Pina/);
	});
});
