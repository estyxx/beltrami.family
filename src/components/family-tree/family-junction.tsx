import { Handle, Position } from "@xyflow/react";
import { SOURCE_HANDLE, TARGET_HANDLE } from "lib/family/layout";

/**
 * The GEDCOM `FAM` record drawn as an invisible point: partner edges end here
 * and the children's edges start here, so a child needs a single edge.
 */
export const FamilyJunction = () => {
	return (
		<div className="pointer-events-none h-full w-full opacity-0">
			<Handle type="target" position={Position.Top} id={TARGET_HANDLE} />
			<Handle type="source" position={Position.Bottom} id={SOURCE_HANDLE} />
		</div>
	);
};
