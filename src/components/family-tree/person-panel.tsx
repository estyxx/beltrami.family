import { formatName } from "lib/family/display";
import { getRelatives } from "lib/family/relations";
import type { FamilyData, FamilyMember } from "lib/family/types";

type PersonPanelProps = {
	data: FamilyData;
	person: FamilyMember;
	onSelect: (id: string) => void;
	onClose: () => void;
};

const SEX_LABELS: Record<string, string> = {
	M: "Uomo",
	F: "Donna",
};

export const PersonPanel = ({
	data,
	person,
	onSelect,
	onClose,
}: PersonPanelProps) => {
	const { parents, partners, children } = getRelatives(data, person.id);

	return (
		<aside className="max-h-[70vh] w-72 overflow-y-auto rounded-lg border border-gray-300 bg-white p-4 shadow-lg">
			<div className="flex items-start justify-between gap-2">
				<h2 className="text-lg font-semibold text-gray-800">
					{formatName(person) || "Senza nome"}
				</h2>
				<button
					type="button"
					onClick={onClose}
					aria-label="Chiudi"
					className="text-gray-500 hover:text-gray-800"
				>
					✕
				</button>
			</div>

			<dl className="mt-3 space-y-1 text-sm text-gray-600">
				<Detail label="Nascita" value={person.birth?.date?.raw} />
				<Detail label="Morte" value={person.death?.date?.raw} />
				<Detail label="Sesso" value={SEX_LABELS[person.sex ?? ""]} />
			</dl>

			<Relatives label="Genitori" people={parents} onSelect={onSelect} />
			<Relatives label="Partner" people={partners} onSelect={onSelect} />
			<Relatives label="Figli" people={children} onSelect={onSelect} />
		</aside>
	);
};

const Detail = ({ label, value }: { label: string; value?: string }) => {
	if (!value) return null;

	return (
		<div className="flex gap-1">
			<dt className="font-medium">{label}:</dt>
			<dd>{value}</dd>
		</div>
	);
};

type RelativesProps = {
	label: string;
	people: FamilyMember[];
	onSelect: (id: string) => void;
};

const Relatives = ({ label, people, onSelect }: RelativesProps) => {
	if (people.length === 0) return null;

	return (
		<section className="mt-4">
			<h3 className="text-sm font-medium text-gray-800">{label}</h3>
			<ul className="mt-1 space-y-1">
				{people.map((person) => (
					<li key={person.id}>
						<button
							type="button"
							onClick={() => onSelect(person.id)}
							className="text-sm text-cyan-700 hover:underline"
						>
							{formatName(person) || "Senza nome"}
						</button>
					</li>
				))}
			</ul>
		</section>
	);
};
