import { Avatar } from "@heroui/react";
import type { AgentInfo } from "./api";

export function sortAgents(agents: string[], allAgents: AgentInfo[]): string[] {
	const orderMap = new Map(allAgents.map((a, i) => [a.id, i]));
	return [...agents].sort((a, b) => {
		const indexA = orderMap.get(a) ?? -1;
		const indexB = orderMap.get(b) ?? -1;
		if (indexA === -1 && indexB === -1) return a.localeCompare(b);
		if (indexA === -1) return 1;
		if (indexB === -1) return -1;
		return indexA - indexB;
	});
}

export function sortAgentObjects<T extends { agent?: string | null }>(
	items: T[],
	allAgents: AgentInfo[],
): T[] {
	const orderMap = new Map(allAgents.map((a, i) => [a.id, i]));
	return [...items].sort((a, b) => {
		const idA = a.agent ?? "default";
		const idB = b.agent ?? "default";
		const indexA = orderMap.get(idA) ?? -1;
		const indexB = orderMap.get(idB) ?? -1;
		if (indexA === -1 && indexB === -1) return idA.localeCompare(idB);
		if (indexA === -1) return 1;
		if (indexB === -1) return -1;
		return indexA - indexB;
	});
}

// Import all agent icons as raw SVG strings
const iconModules = import.meta.glob<{ default: string }>(
	"../assets/agent/*.svg",
	{
		eager: true,
		query: "?raw",
	},
);

interface AgentIconProps {
	id: string;
	name: string;
	size?: "xs" | "sm" | "lg";
	variant?: "outline" | "ghost";
}

export function AgentIcon({
	id,
	name,
	size = "lg",
	variant = "outline",
}: AgentIconProps) {
	const iconPath = `../assets/agent/${id}.svg`;
	const svg = iconModules[iconPath];
	const fallbackText = name.charAt(0).toUpperCase();

	const sizeClasses =
		size === "xs"
			? "size-5 [&_svg]:size-3.5"
			: size === "sm"
				? "size-8 [&_svg]:size-5"
				: "size-12 [&_svg]:size-8";

	const variantClasses =
		variant === "ghost" ? "" : "border border-border bg-surface-secondary";

	if (svg) {
		// Render SVG inside a square container with border
		return (
			<div
				className={`
      flex items-center justify-center rounded-lg
      ${sizeClasses}
      ${variantClasses}
    `}
				// eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
				dangerouslySetInnerHTML={{
					__html: (svg.default || svg) as string,
				}}
			/>
		);
	}

	// Fallback: Avatar with first letter (square with border)
	return (
		<Avatar
			size={size === "xs" ? "sm" : size === "sm" ? "md" : "lg"}
			variant="soft"
			className={variant === "ghost" ? "" : "border border-border"}
		>
			<Avatar.Fallback>{fallbackText}</Avatar.Fallback>
		</Avatar>
	);
}
