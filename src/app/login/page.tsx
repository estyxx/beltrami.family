"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Button } from "components/button";
import { InputField } from "components/input-field";
import { useAuth } from "contexts/user-context";

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
	"auth/wrong-password":
		"The password you entered is incorrect. Please try again.",
	"auth/user-not-found":
		"No user found with this email. Please check your email address.",
	"auth/invalid-email":
		"The email address is not valid. Please enter a valid email address.",
	"auth/network-request-failed":
		"A network error occurred. Please check your connection.",
	"auth/too-many-requests": "Too many login attempts. Please try again later.",
};

const LoginForm = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const router = useRouter();
	const [error, setError] = useState("");
	const searchParams = useSearchParams();
	const redirect = searchParams?.get("redirect") || "/family-tree";
	const { login, resetPassword } = useAuth();

	const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		setError("");
		event.preventDefault();
		try {
			const credentials = await login(email, password);
			router.push(redirect);
		} catch (error: unknown) {
			console.error({ error });

			// Get Firebase error code and map to custom message
			const firebaseError =
				(error as { code?: string })?.code || "unknown-error";
			const message =
				FIREBASE_ERROR_MESSAGES[firebaseError] ||
				"An unexpected error occurred. Please try again.";
			setError(message);
		}
	};

	const handleResetPassword = async () => {
		try {
			await resetPassword(email);
			alert("Password reset email sent. Please check your inbox.");
		} catch (error) {
			alert(
				(error as { message?: string })?.message ||
					"Failed to send password reset email. Please try again.",
			);
		}
	};

	return (
		<form onSubmit={onSubmit}>
			<div className="flex flex-col px-8 pt-6 pb-8 mb-4 bg-white rounded shadow-md">
				<InputField
					id="email"
					label="Email"
					type="email"
					placeholder="me@beltrami.it"
					value={email}
					onChange={setEmail}
					error={error.includes("email") ? error : ""}
					required
				/>

				<InputField
					id="password"
					label="Password"
					type="password"
					placeholder="password"
					value={password}
					onChange={setPassword}
					error={error.includes("password") ? error : ""}
					required
				/>
				<div>
					<button
						type="button"
						onClick={handleResetPassword}
						className="text-sm text-blue-500 hover:underline"
					>
						Forgot Password?
					</button>
				</div>

				<div className="mb-6">
					<Button type="submit" variant="primary" size="md">
						Entra
					</Button>

					{error && (
						<div className="mb-6">
							<p className="text-xs italic text-red">{error}</p>
						</div>
					)}
				</div>
			</div>
		</form>
	);
};

export default function LoginPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<LoginForm />
		</Suspense>
	);
}
