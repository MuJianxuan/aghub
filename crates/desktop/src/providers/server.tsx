import { Spinner } from "@heroui/react";
import { invoke } from "@tauri-apps/api/core";
import type { ReactNode } from "react";
import { createContext, useEffect, useState } from "react";

interface ServerContext {
	port: number;
	baseUrl: string;
}

const ServerContext = createContext<ServerContext | null>(null);

export function useServer(): ServerContext {
	const ctx = use(ServerContext);
	if (!ctx) throw new Error("useServer must be used within <ServerProvider>");
	return ctx;
}

export function ServerProvider({ children }: { children: ReactNode }) {
	const [port, setPort] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		invoke<number>("start_server")
			.then(setPort)
			.catch((e) => setError(String(e)));
	}, []);

	if (error) {
		return (
			<div className="flex h-screen items-center justify-center">
				<p className="text-sm text-danger">
					Failed to start server: {error}
				</p>
			</div>
		);
	}

	if (port === null) {
		return (
			<div className="flex h-screen items-center justify-center">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<ServerContext
			value={{ port, baseUrl: `http://localhost:${port}/api/v1` }}
		>
			{children}
		</ServerContext>
	);
}
