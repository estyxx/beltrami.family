import "app/globals.css";
import "tailwindcss/tailwind.css";

import { NavBar } from "components/navbar";
import { AuthUserProvider } from "contexts/user-context";
import type { ReactNode } from "react";

export const metadata = {
	title: "Beltrami Family",
	description: "Explore the Beltrami Family Tree",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<AuthUserProvider>
			<html lang="en">
				<head>
					<link rel="icon" href="/favicon.png" />
				</head>
				<body>
					<NavBar />
					{children}
				</body>
			</html>
		</AuthUserProvider>
	);
}
