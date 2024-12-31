import { Handle, Position } from "@xyflow/react";
import type { FamilyMember } from "app/family-tree/types";

export const FamilyNode = ({ data }: { data: FamilyMember }) => {
	return (
		<div className="p-4 border rounded-lg shadow-md bg-white border-gray-300">
			<Handle type="target" position={Position.Bottom} id="top" />
			<Handle type="target" position={Position.Bottom} id="left" />
			<Handle type="source" position={Position.Top} id="right" />
			<Handle type="source" position={Position.Top} id="bottom" />

			<strong className="block text-lg font-semibold text-gray-800">
				{data.name}
			</strong>
			{data.birthDate && (
				<p className="text-sm text-gray-600">
					<span className="font-medium">Birth:</span> {data.birthDate}
				</p>
			)}
			<p className="text-sm text-gray-600">{data.sex === "M" ? "♂️" : "♀️"}</p>
		</div>
	);
};
