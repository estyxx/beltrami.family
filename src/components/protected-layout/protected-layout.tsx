"use client";

import { useAuth } from "contexts/user-context";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

interface ProtectedLayoutProps {
	children: ReactNode;
}

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => {
	const { user, loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!loading && !user) {
			router.push("/login");
		}
	}, [user, loading, router]);

	if (loading || !user) {
		return <p>Loading...</p>; // You can customize this with a spinner or skeleton
	}

	return <>{children}</>;
};

export default ProtectedLayout;
