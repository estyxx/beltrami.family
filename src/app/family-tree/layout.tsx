import { ReactFlowProvider } from "@xyflow/react";
import { createProtectedLayout } from "components/protected-layout";

const FamilyTreeLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<ReactFlowProvider>
			<div className="w-full h-[calc(100vh-86px)]">{children}</div>
		</ReactFlowProvider>
	);
};

export default createProtectedLayout(FamilyTreeLayout);
