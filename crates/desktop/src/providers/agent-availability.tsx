import { Spinner } from "@heroui/react";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { createApi, type AgentInfo, type AgentAvailability } from "../lib/api";
import { useServer } from "../providers/server";
import { getDisabledAgents } from "../lib/store";

export interface AvailableAgent extends AgentInfo {
	availability: AgentAvailability;
	isDisabled: boolean;
	isUsable: boolean; // is_available && !isDisabled
}

interface AgentAvailabilityContext {
	availableAgents: AvailableAgent[];
	allAgents: AgentInfo[];
	isLoading: boolean;
	refetch: () => void;
}

const AgentAvailabilityContext = createContext<AgentAvailabilityContext | null>(
	null,
);

export function useAgentAvailability(): AgentAvailabilityContext {
	const ctx = useContext(AgentAvailabilityContext);
	if (!ctx)
		throw new Error(
			"useAgentAvailability must be used within <AgentAvailabilityProvider>",
		);
	return ctx;
}

export function AgentAvailabilityProvider({
	children,
}: {
	children: ReactNode;
}) {
	const { baseUrl } = useServer();
	const api = createApi(baseUrl);
	const [disabledAgents, setDisabledAgents] = useState<Set<string>>(new Set());

	// Fetch all agents
	const {
		data: allAgents = [],
		isLoading: isLoadingAgents,
		refetch: refetchAgents,
	} = useQuery({
		queryKey: ["agents"],
		queryFn: () => api.agents.list(),
	});

	// Fetch availability
	const {
		data: availabilityData = [],
		isLoading: isLoadingAvailability,
		refetch: refetchAvailability,
	} = useQuery({
		queryKey: ["agents-availability"],
		queryFn: () => api.agents.availability(),
	});

	// Load disabled agents from store
	useEffect(() => {
		getDisabledAgents().then((disabled: string[]) => {
			setDisabledAgents(new Set(disabled));
		});
	}, []);

	// Combine data
	const availableAgents: AvailableAgent[] = allAgents.map((agent: AgentInfo) => {
		const availability: AgentAvailability =
			availabilityData.find((a: AgentAvailability) => a.id === agent.id) ??
			({
				id: agent.id,
				has_global_directory: false,
				has_cli: false,
				is_available: false,
			} as AgentAvailability);

		const isDisabled = disabledAgents.has(agent.id);
		const isUsable = availability.is_available && !isDisabled;

		return {
			...agent,
			availability,
			isDisabled,
			isUsable,
		};
	});

	const isLoading = isLoadingAgents || isLoadingAvailability;

	const refetch = () => {
		refetchAgents();
		refetchAvailability();
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<AgentAvailabilityContext
			value={{
				availableAgents,
				allAgents,
				isLoading,
				refetch,
			}}
		>
			{children}
		</AgentAvailabilityContext>
	);
}