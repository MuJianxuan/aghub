import {
	ArrowPathIcon,
	CheckCircleIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	MinusIcon,
	PlusIcon,
	XCircleIcon,
} from "@heroicons/react/24/solid";
import { Button, Chip, Modal, Spinner } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createApi } from "../lib/api";
import type { McpResponse } from "../lib/api-types";
import { useAgentAvailability } from "../providers/agent-availability";
import { useServer } from "../providers/server";

interface ManageAgentsDialogProps {
	group: {
		mergeKey: string;
		transport: McpResponse["transport"];
		items: McpResponse[];
	};
	isOpen: boolean;
	onClose: () => void;
}

type WizardStep = 1 | 2 | 3;

interface AgentResult {
	agentId: string;
	displayName: string;
	action: "install" | "uninstall";
	status: "pending" | "success" | "error";
	error?: string;
}

export function ManageAgentsDialog({
	group,
	isOpen,
	onClose,
}: ManageAgentsDialogProps) {
	const { t } = useTranslation();
	const { baseUrl } = useServer();
	const api = createApi(baseUrl);
	const queryClient = useQueryClient();
	const { availableAgents } = useAgentAvailability();

	const usableAgents = availableAgents.filter((a) => a.isUsable);
	const currentAgentIds = new Set(
		group.items.map((item) => item.agent ?? "default"),
	);

	const [step, setStep] = useState<WizardStep>(1);
	const [selectedAgents, setSelectedAgents] = useState<Set<string>>(
		new Set(currentAgentIds),
	);
	const [results, setResults] = useState<AgentResult[]>([]);

	// Reset state when dialog opens or group changes
	useEffect(() => {
		if (isOpen) {
			setStep(1);
			setSelectedAgents(new Set(currentAgentIds));
			setResults([]);
		}
	}, [isOpen, group]);

	const toInstall = [...selectedAgents].filter((id) => !currentAgentIds.has(id));
	const toUninstall = [...currentAgentIds].filter((id) => !selectedAgents.has(id));
	const hasChanges = toInstall.length > 0 || toUninstall.length > 0;

	const toggleAgent = (agentId: string) => {
		setSelectedAgents((prev) => {
			const next = new Set(prev);
			if (next.has(agentId)) {
				if (next.size <= 1) return prev;
				next.delete(agentId);
			} else {
				next.add(agentId);
			}
			return next;
		});
	};

	const getAgentDisplayName = useCallback(
		(agentId: string) => {
			const agent = availableAgents.find((a) => a.id === agentId);
			if (agent) return agent.display_name;
			return agentId.charAt(0).toUpperCase() + agentId.slice(1);
		},
		[availableAgents],
	);

	const handleApply = async () => {
		setStep(3);

		const primary = group.items[0];
		const pendingResults: AgentResult[] = [
			...toInstall.map((id) => ({
				agentId: id,
				displayName: getAgentDisplayName(id),
				action: "install" as const,
				status: "pending" as const,
			})),
			...toUninstall.map((id) => ({
				agentId: id,
				displayName: getAgentDisplayName(id),
				action: "uninstall" as const,
				status: "pending" as const,
			})),
		];
		setResults(pendingResults);

		const updatedResults = await Promise.all(
			pendingResults.map(async (result) => {
				try {
					if (result.action === "install") {
						await api.mcps.create(result.agentId, "global", {
							name: primary.name,
							transport: primary.transport,
							timeout: primary.timeout,
						});
					} else {
						const scope =
							group.items.find(
								(i) => (i.agent ?? "default") === result.agentId,
							)?.source === "Project"
								? "project"
								: "global";
						await api.mcps.delete(
							primary.name,
							result.agentId,
							scope,
						);
					}
					return { ...result, status: "success" as const };
				} catch (err) {
					return {
						...result,
						status: "error" as const,
						error: err instanceof Error ? err.message : String(err),
					};
				}
			}),
		);

		setResults(updatedResults);
		queryClient.invalidateQueries({ queryKey: ["mcps"] });
	};

	const handleClose = () => {
		setStep(1);
		setSelectedAgents(new Set(currentAgentIds));
		setResults([]);
		onClose();
	};

	const stepLabels = [
		t("selectAgents"),
		t("confirmChanges"),
		t("result"),
	];

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={handleClose}>
			<Modal.Container>
				<Modal.Dialog className="max-w-xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Heading>{t("manageAgents")}</Modal.Heading>
					</Modal.Header>

					<Modal.Body className="p-2">
						{/* Step Indicator */}
						<div className="flex items-center justify-center gap-2 mb-6">
							{[1, 2, 3].map((s, idx) => (
								<div key={s} className="flex items-center gap-2">
									<div
										className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
											s < step
												? "bg-accent/15 text-accent"
												: s === step
													? "bg-accent text-accent-foreground"
													: "bg-default-100 text-muted"
										}`}
									>
										<span
											className={`flex items-center justify-center size-4.5 rounded-full text-[10px] font-bold ${
												s < step
													? "bg-accent text-accent-foreground"
													: s === step
														? "bg-accent-foreground text-accent"
														: "bg-default-200 text-muted"
											}`}
										>
											{s < step ? "✓" : s}
										</span>
										{stepLabels[idx]}
									</div>
									{idx < 2 && (
										<div
											className={`w-6 h-px ${
												s < step
													? "bg-accent"
													: "bg-default-200"
											}`}
										/>
									)}
								</div>
							))}
						</div>

						{/* Step 1: Agent Selection */}
						{step === 1 && (
							<div>
								<p className="text-sm text-muted mb-3">
									{t("selectAgentsForMcp")}
								</p>
								{usableAgents.length === 0 ? (
									<p className="text-sm text-muted">
										{t("noTargetAgents")}
									</p>
								) : (
									<div className="flex flex-wrap gap-2">
										{usableAgents.map((agent) => {
											const isSelected = selectedAgents.has(
												agent.id,
											);
											const isCurrentAgent =
												currentAgentIds.has(agent.id);
											const isLastSelected =
												isSelected &&
												selectedAgents.size === 1;
											return (
												<button
													key={agent.id}
													type="button"
													disabled={isLastSelected}
													onClick={() =>
														toggleAgent(agent.id)
													}
													className={`flex items-center gap-1.5 px-2.5 py-1 text-sm rounded-full border transition-colors ${
														isLastSelected
															? "bg-accent text-accent-foreground border-accent opacity-60 cursor-not-allowed"
															: isSelected
																? "bg-accent text-accent-foreground border-accent"
																: "bg-transparent text-muted border-default-200 hover:border-default-300"
													}`}
												>
													{agent.display_name}
													{isSelected &&
														!isCurrentAgent && (
															<PlusIcon className="size-3" />
														)}
												</button>
											);
										})}
									</div>
								)}
							</div>
						)}

						{/* Step 2: Diff Preview */}
						{step === 2 && (
							<div className="space-y-4">
								{toInstall.length > 0 && (
									<div>
										<p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
											{t("toInstall")}
										</p>
										<div className="flex flex-wrap gap-1.5">
											{toInstall.map((id) => (
												<Chip
													key={id}
													size="sm"
													color="success"
												>
													<div className="flex items-center gap-1">
														<PlusIcon className="size-3" />
														{getAgentDisplayName(id)}
													</div>
												</Chip>
											))}
										</div>
									</div>
								)}
								{toUninstall.length > 0 && (
									<div>
										<p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
											{t("toUninstall")}
										</p>
										<div className="flex flex-wrap gap-1.5">
											{toUninstall.map((id) => (
												<Chip
													key={id}
													size="sm"
													color="danger"
												>
													<div className="flex items-center gap-1">
														<MinusIcon className="size-3" />
														{getAgentDisplayName(id)}
													</div>
												</Chip>
											))}
										</div>
									</div>
								)}
							</div>
						)}

						{/* Step 3: Result */}
						{step === 3 && (
							<div className="space-y-2">
								{results.length === 0 && (
									<p className="text-sm text-muted">
										{t("noChanges")}
									</p>
								)}
								{results.some((r) => r.status === "pending") && (
									<div className="flex items-center justify-center py-6">
										<Spinner size="lg" />
									</div>
								)}
								{results.map((result) => (
									<div
										key={result.agentId}
										className="flex items-start gap-2 p-2 rounded-lg bg-default-50"
									>
										{result.status === "pending" && (
											<ArrowPathIcon className="size-4 text-muted shrink-0 mt-0.5 animate-spin" />
										)}
										{result.status === "success" && (
											<CheckCircleIcon className="size-4 text-success shrink-0 mt-0.5" />
										)}
										{result.status === "error" && (
											<XCircleIcon className="size-4 text-danger shrink-0 mt-0.5" />
										)}
										<div className="min-w-0">
											<p className="text-sm font-medium">
												{result.displayName}
											</p>
											<p className="text-xs text-muted">
												{result.status === "pending"
													? result.action === "install"
														? t("installing")
														: t("uninstalling")
													: result.status === "success"
														? result.action === "install"
															? t("installSuccess")
															: t("uninstallSuccess")
														: result.error}
											</p>
										</div>
									</div>
								))}
							</div>
						)}
					</Modal.Body>

					<Modal.Footer>
						{step === 1 && (
							<>
								<Button
									slot="close"
									variant="secondary"
								>
									{t("cancel")}
								</Button>
								<Button
									onPress={() => setStep(2)}
									isDisabled={!hasChanges}
								>
									{t("next")}
									<ChevronRightIcon className="size-3.5" />
								</Button>
							</>
						)}
						{step === 2 && (
							<>
								<Button
									variant="secondary"
									onPress={() => setStep(1)}
								>
									<ChevronLeftIcon className="size-3.5" />
									{t("back")}
								</Button>
								<Button
									onPress={handleApply}
									isDisabled={!hasChanges}
								>
									{t("apply")}
									<ChevronRightIcon className="size-3.5" />
								</Button>
							</>
						)}
						{step === 3 && (
							<Button
								slot="close"
								variant="secondary"
							>
								{t("done")}
							</Button>
						)}
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
