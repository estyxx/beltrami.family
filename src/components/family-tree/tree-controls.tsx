"use client";
import { formatLifespan, formatName } from "lib/family/display";
import type { FocusOptions } from "lib/family/focus";
import type { FamilyData, FamilyMember } from "lib/family/types";
import { useMemo, useState } from "react";

type TreeControlsProps = {
	data: FamilyData;
	focus: FamilyMember | undefined;
	options: Required<FocusOptions>;
	/** How many people the canvas is showing. */
	shown: number;
	onFocus: (id: string) => void;
	onOptionsChange: (options: Required<FocusOptions>) => void;
};

const MAX_RESULTS = 8;
const GENERATION_CHOICES = [0, 1, 2, 3, 4, 5];

export const TreeControls = ({
	data,
	focus,
	options,
	shown,
	onFocus,
	onOptionsChange,
}: TreeControlsProps) => {
	const [query, setQuery] = useState("");

	const results = useMemo(() => {
		const needle = query.trim().toLowerCase();
		if (needle.length < 2) return [];

		return Object.values(data.individuals)
			.filter((member) => formatName(member).toLowerCase().includes(needle))
			.slice(0, MAX_RESULTS);
	}, [data, query]);

	const total = Object.keys(data.individuals).length;

	return (
		<div className="w-72 rounded-lg border border-gray-300 bg-white p-4 shadow-lg">
			<p className="text-xs uppercase tracking-wide text-gray-500">Al centro</p>
			<p className="text-lg font-semibold text-gray-800">
				{focus ? formatName(focus) || "Senza nome" : "Nessuno"}
			</p>

			<label className="mt-3 block">
				<span className="sr-only">Cerca una persona</span>
				<input
					type="search"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Cerca una persona"
					className="w-full rounded-sm border border-gray-300 px-2 py-1 text-sm"
				/>
			</label>

			{results.length > 0 && (
				<ul className="mt-1 max-h-48 space-y-1 overflow-y-auto">
					{results.map((member) => (
						<li key={member.id}>
							<button
								type="button"
								onClick={() => {
									onFocus(member.id);
									setQuery("");
								}}
								className="w-full rounded-sm px-2 py-1 text-left text-sm text-gray-700 hover:bg-gray-100"
							>
								{formatName(member) || "Senza nome"}
								<span className="ml-1 text-xs text-gray-500">
									{formatLifespan(member)}
								</span>
							</button>
						</li>
					))}
				</ul>
			)}

			<div className="mt-4 space-y-2 text-sm text-gray-700">
				<Generations
					label="Generazioni sopra"
					value={options.ancestors}
					onChange={(ancestors) => onOptionsChange({ ...options, ancestors })}
				/>
				<Generations
					label="Generazioni sotto"
					value={options.descendants}
					onChange={(descendants) =>
						onOptionsChange({ ...options, descendants })
					}
				/>
				<label className="flex items-center gap-2">
					<input
						type="checkbox"
						checked={options.collateral}
						onChange={(event) =>
							onOptionsChange({ ...options, collateral: event.target.checked })
						}
					/>
					Fratelli e cugini
				</label>
			</div>

			<p className="mt-3 text-xs text-gray-500">
				{shown} persone su {total}
			</p>
		</div>
	);
};

type GenerationsProps = {
	label: string;
	value: number;
	onChange: (value: number) => void;
};

const Generations = ({ label, value, onChange }: GenerationsProps) => (
	<label className="flex items-center justify-between gap-2">
		{label}
		<select
			value={value}
			onChange={(event) => onChange(Number(event.target.value))}
			className="rounded-sm border border-gray-300 px-2 py-1"
		>
			{GENERATION_CHOICES.map((choice) => (
				<option key={choice} value={choice}>
					{choice}
				</option>
			))}
		</select>
	</label>
);
