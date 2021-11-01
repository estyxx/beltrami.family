import { ProtectedLayout } from "components/protected-layout";

interface PageProps {
	children: React.ReactNode;
}

export default function createProtectedLayout(
	PageComponent: React.FC<PageProps>,
) {
	return function ProtectedPage({ children }: { children: React.ReactNode }) {
		return (
			<ProtectedLayout>
				<PageComponent>{children}</PageComponent>
			</ProtectedLayout>
		);
	};
}
