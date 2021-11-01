"use client";
import clsx from "clsx";
import { Button } from "components/button";
import { useAuth } from "contexts/user-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
export const NavBar = () => {
	const { user, logout } = useAuth();
	const router = useRouter();

	const [isOpen, setIsOpen] = useState(false);

	const handleLoginLogout = () => {
		if (user) {
			logout();
		} else {
			router.push("/login?redirect=/");
		}
	};

	return (
		<div className="w-full font-sans antialiased">
			<nav className="flex flex-wrap items-center justify-between p-6 m-auto max-w-7xl bg-teal">
				<div className="flex items-center mr-6 text-black flex-no-shrink">
					<Link
						className="block mt-4 mr-4 no-underline sm:inline-block sm:mt-0 text-teal-lighter hover:text-white"
						href="/"
					>
						Home
					</Link>
				</div>
				<div className={"block sm:hidden"}>
					<button
						type="button"
						onClick={() => setIsOpen(!isOpen)}
						className="flex items-center px-3 py-2 border rounded text-teal-lighter border-teal-light hover:text-white hover:border-white"
					>
						<svg
							className="w-3 h-3 fill-current"
							viewBox="0 0 20 20"
							xmlns="http://www.w3.org/2000/svg"
						>
							<title>Menu</title>
							<path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
						</svg>
					</button>
				</div>
				<div
					className={clsx(
						{ block: isOpen, hidden: !isOpen },
						"lex-grow w-full sm:flex sm:items-center sm:w-auto",
					)}
				>
					<div className="text-sm sm:flex-grow">
						{/* <a
              className="block mt-4 mr-4 no-underline sm:inline-block sm:mt-0 text-teal-lighter hover:text-white"
            >
              Docs
            </a> */}
					</div>
					<div>
						<Button variant="secondary" size="sm" onClick={handleLoginLogout}>
							{user ? "Esci" : "Login"}
						</Button>
					</div>
				</div>
			</nav>
		</div>
	);
};
