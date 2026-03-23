import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { Chip, Switch } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useAgentAvailability, type AvailableAgent } from "../../providers/agent-availability";
import { disableAgent, enableAgent } from "../../lib/store";
import { useState } from "react";

export default function AgentManagementPage() {
	const { t } = useTranslation();
	const { availableAgents, refetch } = useAgentAvailability();
	const [updating, setUpdating] = useState<string | null>(null);

	const handleToggle = async (agentId: string, currentlyDisabled: boolean) => {
		setUpdating(agentId);
		try {
			if (currentlyDisabled) {
				await enableAgent(agentId);
			} else {
				await disableAgent(agentId);
			}
			// Refetch to update the UI
			refetch();
		} finally {
			setUpdating(null);
		}
	};

	return (
		<div className="h-full overflow-y-auto">
			<div className="p-6 max-w-3xl">
				<h2 className="text-xl font-semibold mb-2">
					{t("agentManagement")}
				</h2>
				<p className="text-sm text-muted mb-6">
					{t("agentManagementDescription")}
				</p>

				<div className="space-y-2">
					{availableAgents.map((agent: AvailableAgent) => {
						const isUpdating = updating === agent.id;
						const statusText = agent.availability.is_available
							? agent.isDisabled
								? t("disabledByUser")
								: t("available")
							: t("notAvailable");

						return (
							<div
								key={agent.id}
								className="flex items-center justify-between p-4 rounded-lg border border-border bg-surface"
							>
								<div className="flex items-center gap-4 flex-1 min-w-0">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<span className="font-medium text-foreground">
												{agent.display_name}
											</span>
											<Chip size="sm" variant="soft">
												{agent.id}
											</Chip>
										</div>
										<div className="flex items-center gap-3 text-xs text-muted">
											<span className="flex items-center gap-1">
												{agent.availability.has_global_directory ? (
													<CheckCircleIcon className="size-3.5 text-success" />
												) : (
													<XCircleIcon className="size-3.5 text-danger" />
												)}
												{t("globalConfig")}
											</span>
											<span className="flex items-center gap-1">
												{agent.availability.has_cli ? (
													<CheckCircleIcon className="size-3.5 text-success" />
												) : (
													<XCircleIcon className="size-3.5 text-danger" />
												)}
												{t("cli")}
											</span>
										</div>
									</div>
								</div>

								<div className="flex items-center gap-3">
									<Chip
										size="sm"
										variant="soft"
										color={
											agent.isUsable
												? "success"
												: agent.availability.is_available &&
														agent.isDisabled
													? "warning"
													: "danger"
										}
									>
										{statusText}
									</Chip>

									<Switch
										isSelected={!agent.isDisabled}
										onChange={() =>
											handleToggle(
												agent.id,
												agent.isDisabled,
											)
										}
										isDisabled={
											!agent.availability.is_available ||
											isUpdating
										}
										aria-label={t("toggleAgent", {
											name: agent.display_name,
										})}
									/>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}