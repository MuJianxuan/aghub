import { Card, Switch, Tooltip } from "@heroui/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { AgentIcon } from "../lib/agent-icons";
import type { AvailableAgent } from "../contexts/agent-availability";

interface AgentCardProps {
	agent: AvailableAgent;
	isUpdating: boolean;
	onToggle: (agentId: string, currentlyDisabled: boolean) => void;
}

const agentAccentColors: Record<string, string> = {
	claude: "#d97706",
	copilot: "#7c3aed",
	cursor: "#0ea5e9",
	codex: "#10b981",
	openai: "#10b981",
	gemini: "#3b82f6",
	amazon_q: "#f97316",
	vscode: "#007acc",
	zed: "#f59e0b",
	windsurf: "#8b5cf6",
	aider: "#ef4444",
	claude_code: "#d97706",
	opencode: "#06b6d4",
	cline: "#22c55e",
	roo: "#f97316",
};

function getAgentAccentColor(agentId: string): string {
	const normalizedId = agentId.toLowerCase().replace(/[_-]/g, "_");
	for (const [key, color] of Object.entries(agentAccentColors)) {
		if (normalizedId.includes(key)) {
			return color;
		}
	}
	return "var(--muted)";
}

export function AgentCard({ agent, isUpdating, onToggle }: AgentCardProps) {
	const { t } = useTranslation();
	const { has_global_directory, has_cli } = agent.availability;
	const accentColor = getAgentAccentColor(agent.id);

	const sources: string[] = [];
	if (has_global_directory) sources.push(t("globalConfig"));
	if (has_cli) sources.push(t("cli"));

	const capabilityLabels: string[] = [];
	if (agent.capabilities.skills) capabilityLabels.push(t("skills"));
	if (agent.capabilities.mcp_stdio || agent.capabilities.mcp_remote)
		capabilityLabels.push(t("mcpServers"));

	return (
		<Tooltip
			content={
				<div className="space-y-1 py-1">
					<p className="font-medium">{agent.display_name}</p>
					{capabilityLabels.length > 0 && (
						<p className="text-xs opacity-80">
							{t("supports")}: {capabilityLabels.join(", ")}
						</p>
					)}
					{agent.skills_cli_name && (
						<p className="text-xs opacity-80">
							{t("cliName")}: {agent.skills_cli_name}
						</p>
					)}
				</div>
			}
			placement="bottom"
			delay={500}
		>
			<Card
				className={clsx(
					"border-l-2 transition-all duration-200 hover:bg-[var(--surface)]",
					agent.isDisabled && "opacity-50",
				)}
				style={{ borderLeftColor: accentColor }}
				variant="transparent"
			>
				<Card.Content className="flex flex-row items-center gap-3">
					<AgentIcon id={agent.id} name={agent.display_name} />
					<div className="min-w-0 flex-1">
						<Card.Title>{agent.display_name}</Card.Title>
						{sources.length > 0 && (
							<Card.Description>
								{t("detectedVia", { sources: sources.join(" / ") })}
							</Card.Description>
						)}
					</div>
					<Tooltip
						content={
							agent.isDisabled
								? t("enableAgentTooltip", { name: agent.display_name })
								: t("disableAgentTooltip", { name: agent.display_name })
						}
						placement="top"
					>
						<Switch
							isSelected={!agent.isDisabled}
							onChange={() => onToggle(agent.id, agent.isDisabled)}
							isDisabled={isUpdating}
							aria-label={t("toggleAgent", { name: agent.display_name })}
						>
							<Switch.Control>
								<Switch.Thumb />
							</Switch.Control>
						</Switch>
					</Tooltip>
				</Card.Content>
			</Card>
		</Tooltip>
	);
}
