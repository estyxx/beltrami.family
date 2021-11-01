// Import the functions you need from the SDKs you need

"use client";
import { initializeApp } from "firebase/app";

import {
	type User,
	type UserCredential,
	getAuth,
	onAuthStateChanged,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signOut,
} from "firebase/auth";
import { firebaseConfig } from "helpers/config";
import { useCallback, useEffect, useState } from "react";

initializeApp(firebaseConfig);

const auth = getAuth();

export type UserData = {
	uid: string;
	email: string | null;
};

export default function useFirebaseAuth() {
	const [user, setUser] = useState<UserData | null>(null);
	const [loading, setLoading] = useState(true);

	const authStateChanged = useCallback(async (authState: User | null) => {
		if (!authState) {
			setLoading(false);
			return;
		}

		setLoading(true);

		setUser({
			uid: authState.uid,
			email: authState.email,
		});
		setLoading(false);
	}, []);

	const clear = () => {
		setUser(null);
		setLoading(true);
	};

	const logout = async () => {
		await signOut(auth);
		clear();
	};

	const login = async (
		email: string,
		password: string,
	): Promise<UserCredential> => {
		return signInWithEmailAndPassword(auth, email, password);
	};

	const resetPassword = async (email: string) => {
		if (!email) throw new Error("Please provide an email address.");
		await sendPasswordResetEmail(auth, email);
	};

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, authStateChanged);
		return () => unsubscribe();
	}, [authStateChanged]);

	return {
		user,
		loading,
		login,
		logout,
		resetPassword,
	};
}
