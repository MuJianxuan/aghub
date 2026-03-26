import {
	Button,
	Description,
	Fieldset,
	Label,
	Modal,
	Tag,
	TagGroup,
	TextArea,
	TextField,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAgentAvailability } from "../hooks/use-agent-availability";
import { useServer } from "../hooks/use-server";
import { createApi } from "../lib/api";
import type { TransportDto } from "../lib/api-types";

interface ImportMcpPanelProps {
	onDone: () => void;
	projectPath?: string;
}

interface McpServerConfig {
	command?: string;
	args?: string[];
	env?: Record<string, string>;
	url?: string;
	headers?: Record<string, string>;
	timeout?: number;
}

interface McpConfigJson {
	mcpServers?: Record<string, McpServerConfig>;
}

export function ImportMcpPanel({ onDone, projectPath }: ImportMcpPanelProps) {
	const { t } = useTranslation();
	const { baseUrl } = useServer();
	const api = createApi(baseUrl);
	const queryClient = useQueryClient();
	const { availableAgents } = useAgentAvailability();

	const usableAgents = useMemo(
		() => availableAgents.filter((a) => a.isUsable),
		[availableAgents],
	);

	const [jsonText, setJsonText] = useState("");
	const [parseError, setParseError] = useState("");
	const [error, setError] = useState<string | null>(null);

	// Parsed configuration state
	const [parsedConfig, setParsedConfig] = useState<{
		name: string;
		config: McpServerConfig;
		transportType: "stdio" | "sse" | "streamable_http";
	} | null>(null);

	// Confirmation dialog state
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [selectedAgents, setSelectedAgents] = useState<Set<string>>(() => {
		return new Set(usableAgents[0] ? [usableAgents[0].id] : []);
	});

	const createMutation = useMutation({
		onError: (error) => {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			setError(errorMessage);
		},
		mutationFn: ({
			agent,
			body,
		}: {
			agent: string;
			body: { name: string; transport: TransportDto; timeout?: number };
		}) => {
			const scope = projectPath ? "project" : "global";
			return api.mcps.create(agent, scope, body, projectPath);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["mcps"] });
			queryClient.invalidateQueries({ queryKey: ["project-mcps"] });
		},
	});

	const handleParseJson = () => {
		setParseError("");
		setError(null);
		setParsedConfig(null);

		try {
			const parsed: McpConfigJson = JSON.parse(jsonText);

			if (!parsed.mcpServers || typeof parsed.mcpServers !== "object") {
				setParseError(t("parseError"));
				return;
			}

			const serverNames = Object.keys(parsed.mcpServers);
			if (serverNames.length === 0) {
				setParseError(t("parseError"));
				return;
			}

			const serverName = serverNames[0];
			const config = parsed.mcpServers[serverName];

			// Determine transport type
			let transportType: "stdio" | "sse" | "streamable_http";
			if (config.command) {
				transportType = "stdio";
			} else if (config.url) {
				transportType = "sse";
			} else {
				setParseError(t("parseError"));
				return;
			}

			setParsedConfig({ name: serverName, config, transportType });
			// Open confirmation dialog immediately after parsing
			setShowConfirmDialog(true);
		} catch {
			setParseError(t("invalidJson"));
		}
	};

	const handleConfirmImport = async () => {
		if (!parsedConfig || selectedAgents.size === 0) return;

		const { name, config, transportType } = parsedConfig;

		// Build transport
		let transport: TransportDto;
		if (transportType === "stdio") {
			transport = {
				type: "stdio",
				command: config.command || "",
				args: config.args,
				env: config.env,
			};
		} else {
			transport = {
				type: transportType,
				url: config.url || "",
				headers: config.headers,
			};
		}

		const body = {
			name,
			transport,
			timeout: config.timeout,
		};

		try {
			await Promise.all(
				Array.from(selectedAgents).map((agent) =>
					createMutation.mutateAsync({ agent, body }),
				),
			);
			setShowConfirmDialog(false);
			onDone();
		} catch {
			// Error is handled by onError callback
		}
	};

	return (
		<div className="h-full max-w-3xl overflow-y-auto p-6">
			<div className="mb-6 flex items-center gap-3">
				<h2 className="text-xl font-semibold text-foreground">
					{t("importFromJson")}
				</h2>
			</div>

			{error && (
				<div className="mb-4 rounded-lg border border-danger/30 bg-danger-soft p-3">
					<p className="text-sm text-danger">
						{t("createError", { error })}
					</p>
				</div>
			)}

			<Fieldset>
				<Fieldset.Group>
					<TextField className="w-full">
						<Label>{t("jsonConfig")}</Label>
						<TextArea
							value={jsonText}
							onChange={(e) => setJsonText(e.target.value)}
							placeholder={t("jsonConfigPlaceholder")}
							className="min-h-75 font-mono text-sm"
						/>
						<Description>{t("jsonConfigHelp")}</Description>
					</TextField>
					{parseError && (
						<div className="text-sm text-danger">{parseError}</div>
					)}
				</Fieldset.Group>
			</Fieldset>

			{/* Actions */}
			<div className="mt-6 flex justify-end gap-2">
				<Button variant="secondary" onPress={onDone}>
					{t("cancel")}
				</Button>
				<Button onPress={handleParseJson} isDisabled={!jsonText.trim()}>
					{t("parseAndImport")}
				</Button>
			</div>

			{/* Confirmation Dialog */}
			<Modal.Backdrop
				isOpen={showConfirmDialog}
				onOpenChange={setShowConfirmDialog}
			>
				<Modal.Container>
					<Modal.Dialog className="max-w-md">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Heading>{t("confirmImport")}</Modal.Heading>
						</Modal.Header>
						<Modal.Body className="p-4">
							{parsedConfig && (
								<div className="space-y-4">
									<div>
										<p className="mb-1 text-xs tracking-wide text-muted uppercase">
											{t("serverName")}
										</p>
										<p className="text-foreground">
											{parsedConfig.name}
										</p>
									</div>

									<div>
										<p className="mb-1 text-xs tracking-wide text-muted uppercase">
											{t("transportType")}
										</p>
										<p className="text-sm text-foreground">
											{parsedConfig.transportType}
										</p>
									</div>

									<div>
										<p className="mb-1 text-xs tracking-wide text-muted uppercase">
											{parsedConfig.transportType ===
											"stdio"
												? t("command")
												: "URL"}
										</p>
										<p className="text-sm text-foreground">
											{parsedConfig.transportType ===
											"stdio"
												? parsedConfig.config.command
												: parsedConfig.config.url}
										</p>
									</div>

									<div>
										<p className="mb-2 text-xs tracking-wide text-muted uppercase">
											{t("selectAgentsForMcp")}
										</p>
										{usableAgents.length === 0 ? (
											<p className="text-sm text-foreground">
												{t("noTargetAgents")}
											</p>
										) : (
											<TagGroup
												selectionMode="multiple"
												selectedKeys={selectedAgents}
												onSelectionChange={(keys) =>
													setSelectedAgents(
														keys as Set<string>,
													)
												}
												variant="surface"
											>
												<TagGroup.List className="flex-wrap">
													{usableAgents.map(
														(agent) => (
															<Tag
																key={agent.id}
																id={agent.id}
															>
																{
																	agent.display_name
																}
															</Tag>
														),
													)}
												</TagGroup.List>
											</TagGroup>
										)}
									</div>
								</div>
							)}
						</Modal.Body>
						<Modal.Footer>
							<Button
								variant="secondary"
								onPress={() => setShowConfirmDialog(false)}
							>
								{t("cancel")}
							</Button>
							<Button
								onPress={handleConfirmImport}
								isDisabled={
									selectedAgents.size === 0 ||
									createMutation.isPending
								}
							>
								{createMutation.isPending
									? t("importing")
									: t("confirm")}
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</div>
	);
}
