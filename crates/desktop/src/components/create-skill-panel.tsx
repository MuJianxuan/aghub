import {
	Button,
	Card,
	Description,
	Fieldset,
	Form,
	Input,
	Label,
	TextArea,
	TextField,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAgentAvailability } from "../hooks/use-agent-availability";
import { useServer } from "../hooks/use-server";
import { createApi } from "../lib/api";
import type { CreateSkillRequest } from "../lib/api-types";
import { AgentSelector } from "./agent-selector";

interface CreateSkillPanelProps {
	onDone: () => void;
	projectPath?: string;
}

export function CreateSkillPanel({
	onDone,
	projectPath,
}: CreateSkillPanelProps) {
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

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [author, setAuthor] = useState("");
	const [toolsInput, setToolsInput] = useState("");
	const [createAgents, setCreateAgents] = useState<Set<string>>(() => {
		return new Set(skillAgents[0] ? [skillAgents[0].id] : []);
	});

	const [error, setError] = useState<string | null>(null);

	const invalidateCache = () => {
		queryClient.invalidateQueries({ queryKey: ["skills"] });
		queryClient.invalidateQueries({ queryKey: ["project-skills"] });
		queryClient.invalidateQueries({ queryKey: ["skill-locks"] });
	};

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
			body: CreateSkillRequest;
		}) => {
			return api.skills.create(agent, body, projectPath);
		},
		onSuccess: invalidateCache,
	});

	const handleCreate = async () => {
		if (!name.trim()) return;

		const tools = toolsInput
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean);

		const body: CreateSkillRequest = {
			name: name.trim(),
			description: description.trim() || undefined,
			author: author.trim() || undefined,
			tools: tools.length > 0 ? tools : undefined,
		};

		const agentsToCreate = [...createAgents];
		try {
			await Promise.all(
				agentsToCreate.map((agent) =>
					createMutation.mutateAsync({ agent, body }),
				),
			);
			onDone();
		} catch {
			// Error is handled by onError callback
		}
	};

	const isCreateValid = useMemo(() => {
		if (!name.trim()) return false;
		if (createAgents.size === 0) return false;
		if (skillAgents.length === 0) return false;
		return true;
	}, [name, createAgents.size, skillAgents.length]);

	return (
		<div className="h-full max-w-3xl overflow-y-auto p-6">
			{error && (
				<div className="mb-4 rounded-lg border border-danger/30 bg-danger-soft p-3">
					<p className="text-sm text-danger">
						{t("createError", { error })}
					</p>
				</div>
			)}

			<Card>
				<Card.Header>
					<h2 className="text-xl font-semibold text-foreground">
						{t("createCustomSkill")}
					</h2>
				</Card.Header>

				<Card.Content>
					<Form className="space-y-4">
						<Fieldset>
							<Fieldset.Group>
								<TextField className="w-full">
									<Label>{t("skillName")}</Label>
									<Input
										value={name}
										onChange={(e) =>
											setName(e.target.value)
										}
										placeholder={t("skillNamePlaceholder")}
										variant="secondary"
									/>
								</TextField>
								<TextField className="w-full">
									<Label>{t("description")}</Label>
									<TextArea
										value={description}
										onChange={(e) =>
											setDescription(e.target.value)
										}
										placeholder={t(
											"descriptionPlaceholder",
										)}
										className="min-h-24"
										variant="secondary"
									/>
								</TextField>
								<TextField className="w-full">
									<Label>{t("author")}</Label>
									<Input
										value={author}
										onChange={(e) =>
											setAuthor(e.target.value)
										}
										placeholder={t("authorPlaceholder")}
										variant="secondary"
									/>
								</TextField>
								<TextField className="w-full">
									<Label>{t("requiredTools")}</Label>
									<Input
										value={toolsInput}
										onChange={(e) =>
											setToolsInput(e.target.value)
										}
										placeholder={t("toolsPlaceholder")}
										variant="secondary"
									/>
									<Description>
										{t("csvToolsHelp")}
									</Description>
								</TextField>
							</Fieldset.Group>
						</Fieldset>

						<Fieldset>
							<Fieldset.Group>
								<AgentSelector
									agents={skillAgents}
									selectedKeys={createAgents}
									onSelectionChange={setCreateAgents}
									label={t("targetAgent")}
									emptyMessage={t("noAgentsAvailable")}
									emptyHelpText={t("noAgentsAvailableHelp")}
									variant="secondary"
								/>
							</Fieldset.Group>
						</Fieldset>

						{/* Actions */}
						<div className="flex justify-end gap-2 pt-2">
							<Button variant="secondary" onPress={onDone}>
								{t("cancel")}
							</Button>
							<Button
								onPress={handleCreate}
								isDisabled={
									!isCreateValid || createMutation.isPending
								}
							>
								{createMutation.isPending
									? t("creating")
									: t("create")}
							</Button>
						</div>
					</Form>
				</Card.Content>
			</Card>
		</div>
	);
}
