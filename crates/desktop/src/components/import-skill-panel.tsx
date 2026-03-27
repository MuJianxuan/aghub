import { DocumentIcon, FolderOpenIcon } from "@heroicons/react/24/outline";
import {
	Alert,
	Button,
	Card,
	Fieldset,
	Form,
	Input,
	Label,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { open } from "@tauri-apps/plugin-dialog";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAgentAvailability } from "../hooks/use-agent-availability";
import { useServer } from "../hooks/use-server";
import { createApi } from "../lib/api";
import type { ImportSkillRequest } from "../lib/api-types";
import { AgentSelector } from "./agent-selector";

interface ImportSkillPanelProps {
	onDone: () => void;
	projectPath?: string;
}

export function ImportSkillPanel({
	onDone,
	projectPath,
}: ImportSkillPanelProps) {
	const { t } = useTranslation();
	const { baseUrl } = useServer();
	const api = createApi(baseUrl);
	const queryClient = useQueryClient();
	const { availableAgents } = useAgentAvailability();

	const skillAgents = useMemo(
		() =>
			availableAgents.filter(
				(a) => a.isUsable && a.capabilities.skills_mutable,
			),
		[availableAgents],
	);

	const [importPath, setImportPath] = useState("");
	const [importAgents, setImportAgents] = useState<Set<string>>(() => {
		return new Set(skillAgents[0] ? [skillAgents[0].id] : []);
	});

	const [error, setError] = useState<string | null>(null);

	const invalidateCache = () => {
		queryClient.invalidateQueries({ queryKey: ["skills"] });
		queryClient.invalidateQueries({ queryKey: ["project-skills"] });
		queryClient.invalidateQueries({ queryKey: ["skill-locks"] });
	};

	const importMutation = useMutation({
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
			body: ImportSkillRequest;
		}) => {
			return api.skills.import(agent, body, projectPath);
		},
		onSuccess: invalidateCache,
	});

	const handleImportClick = async () => {
		if (!importPath.trim() || importAgents.size === 0) return;

		const body: ImportSkillRequest = {
			path: importPath.trim(),
		};

		const agentsToImport = [...importAgents];
		try {
			await Promise.all(
				agentsToImport.map((agent) =>
					importMutation.mutateAsync({ agent, body }),
				),
			);
			onDone();
		} catch {
			// Error is handled by onError callback
		}
	};

	const handleSelectFile = async () => {
		const selected = await open({
			directory: false,
			multiple: false,
			filters: [
				{
					name: "Skill Files",
					extensions: ["zip", "skill", "json", "toml", "yaml", "yml"],
				},
				{ name: "All Files", extensions: ["*"] },
			],
		});
		if (selected && !Array.isArray(selected)) {
			setImportPath(selected);
		}
	};

	const handleSelectFolder = async () => {
		const selected = await open({ directory: true, multiple: false });
		if (selected && !Array.isArray(selected)) {
			setImportPath(selected);
		}
	};

	const isImportValid = useMemo(() => {
		if (!importPath.trim()) return false;
		if (importAgents.size === 0) return false;
		if (skillAgents.length === 0) return false;
		return true;
	}, [importPath, importAgents.size, skillAgents.length]);

	return (
		<div className="h-full max-w-3xl overflow-y-auto p-6">
			{error && (
				<Alert className="mb-4" status="danger">
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Description>
							{t("importError", { error })}
						</Alert.Description>
					</Alert.Content>
				</Alert>
			)}

			<Card>
				<Card.Header>
					<h2 className="text-xl font-semibold text-foreground">
						{t("importFromFile")}
					</h2>
				</Card.Header>

				<Card.Content>
					<Form className="space-y-4">
						<Fieldset>
							<Fieldset.Group>
								<div className="flex w-full flex-col gap-2">
									<Label>{t("selectFileOrFolder")}</Label>
									<div className="flex w-full items-center gap-2">
										<Input
											className="min-w-0 flex-1"
											value={importPath}
											readOnly
											placeholder={t("selectedPath")}
											variant="secondary"
										/>
										<div className="flex shrink-0 flex-col gap-2 sm:flex-row">
											<Button
												variant="secondary"
												onPress={handleSelectFile}
											>
												<DocumentIcon
													className="size-4"
													aria-hidden="true"
												/>
												{t("file")}
											</Button>
											<Button
												variant="secondary"
												onPress={handleSelectFolder}
											>
												<FolderOpenIcon
													className="size-4"
													aria-hidden="true"
												/>
												{t("folder")}
											</Button>
										</div>
									</div>
								</div>
							</Fieldset.Group>
						</Fieldset>

						<Fieldset>
							<Fieldset.Group>
								<AgentSelector
									agents={skillAgents}
									selectedKeys={importAgents}
									onSelectionChange={setImportAgents}
									label={t("targetAgent")}
									emptyMessage={t("noAgentsAvailable")}
									emptyHelpText={t("noAgentsAvailableHelp")}
									variant="secondary"
								/>
							</Fieldset.Group>
						</Fieldset>

						<div className="flex justify-end gap-2 pt-2">
							<Button variant="secondary" onPress={onDone}>
								{t("cancel")}
							</Button>
							<Button
								onPress={handleImportClick}
								isDisabled={
									!isImportValid || importMutation.isPending
								}
							>
								{importMutation.isPending
									? t("importing")
									: t("import")}
							</Button>
						</div>
					</Form>
				</Card.Content>
			</Card>
		</div>
	);
}
