"use client";
import useFirebaseAuth, { type UserData } from "lib/auth";

import type { UserCredential } from "firebase/auth";
import { type FC, createContext, useContext } from "react";
import type { ReactNode } from "react";

type Context = {
	user: null | UserData;
	loading: boolean;
	login: (email: string, password: string) => Promise<UserCredential>;
	logout: () => Promise<void>;
	resetPassword: (email: string) => Promise<void>;
};

export const authUserContext = createContext<Context>({
	user: null,
	loading: true,
	login: async () => {
		throw new Error("Context not initialized");
	},
	logout: async () => {
		throw new Error("Context not initialized");
	},
	resetPassword: async () => {
		throw new Error("Context not initialized");
	},
});

type AuthUserProviderProps = {
	children: ReactNode;
};

export const AuthUserProvider: FC<AuthUserProviderProps> = ({ children }) => {
	const auth = useFirebaseAuth();
	return (
		<authUserContext.Provider value={auth}>{children}</authUserContext.Provider>
	);
};

export const useAuth = () => useContext(authUserContext);
