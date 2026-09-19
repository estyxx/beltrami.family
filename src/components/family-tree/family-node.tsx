import { Handle, type NodeProps, Position } from "@xyflow/react";
import clsx from "clsx";
import { formatLifespan, formatName } from "lib/family/display";
import {
	type PersonNode,
	SOURCE_HANDLE,
	TARGET_HANDLE,
} from "lib/family/layout";

/** Emoji for the GEDCOM `SEX` value; unknown sex gets a neutral marker. */
function sexIcon(sex: string | null | undefined): string {
	if (sex === "M") return "♂️";
	if (sex === "F") return "♀️";

	return "•";
}

export const FamilyNode = ({ data, selected }: NodeProps<PersonNode>) => {
	const { member } = data;
	const lifespan = formatLifespan(member);

	return (
		<div
			className={clsx(
				"flex h-full w-full flex-col justify-center rounded-lg border bg-white px-4 py-3 shadow-md",
				selected ? "border-cyan-500 ring-2 ring-cyan-300" : "border-gray-300",
			)}
		>
			<Handle type="target" position={Position.Top} id={TARGET_HANDLE} />

			<strong className="block truncate text-base font-semibold text-gray-800">
				{formatName(member) || "Senza nome"}
			</strong>
			{lifespan && <p className="text-sm text-gray-600">{lifespan}</p>}
			<p className="text-sm text-gray-600">{sexIcon(member.sex)}</p>

			<Handle type="source" position={Position.Bottom} id={SOURCE_HANDLE} />
		</div>
	);
};
