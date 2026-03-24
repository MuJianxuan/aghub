import {
	ExclamationTriangleIcon,
	FolderIcon,
	PencilIcon,
	TrashIcon,
	XCircleIcon,
} from "@heroicons/react/24/solid";
import {
	Button,
	Chip,
	Description,
	Fieldset,
	Input,
	Label,
	Modal,
	Spinner,
	TextArea,
	TextField,
} from "@heroui/react";
import { homeDir } from "@tauri-apps/api/path";
import { openPath } from "@tauri-apps/plugin-opener";
import { dirname } from "pathe";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { useServer } from "../providers/server";
import { createApi } from "../lib/api";
import { ConfigSource } from "../lib/api-types";
import type { SkillResponse } from "../lib/api-types";

export interface SkillGroup {
	name: string;
	items: SkillResponse[];
}

interface SkillDetailProps {
	group: SkillGroup;
	projectPath?: string;
}

export function SkillDetail({ group, projectPath }: SkillDetailProps) {
	const { t } = useTranslation();

	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const skill = group.items[0];

	const handleOpenFolder = useCallback(
		async (sourcePath?: string) => {
			if (!sourcePath) return;
			try {
				let path = sourcePath;
				if (path.startsWith("~/")) {
					const home = await homeDir();
					path = `${home}/${path.slice(2)}`;
				}
				const folderPath = dirname(path);
				await openPath(folderPath);
			} catch (error) {
				console.error("Failed to open folder:", error);
			}
		},
		[],
	);

	const globalItems = group.items.filter(
		(item) => item.source === ConfigSource.Global,
	);
	const projectItems = group.items.filter(
		(item) => item.source === ConfigSource.Project,
	);

	return (
		<>
			<div className="h-full overflow-y-auto">
				<div className="p-6 max-w-3xl">
					{/* Header */}
					<div className="flex items-center justify-between gap-3 mb-2">
						<h2 className="text-xl font-semibold text-foreground truncate">
							{skill.name}
						</h2>
						<div className="flex items-center gap-1">
							<Button
								isIconOnly
								variant="ghost"
								size="sm"
								className="text-muted hover:text-foreground shrink-0"
								aria-label={t("editSkill")}
								onPress={() => setEditDialogOpen(true)}
							>
								<PencilIcon className="size-4" />
							</Button>
							<Button
								isIconOnly
								variant="ghost"
								size="sm"
								className="text-muted hover:text-danger shrink-0"
								aria-label={t("deleteSkill")}
								onPress={() => setDeleteDialogOpen(true)}
							>
								<TrashIcon className="size-4" />
							</Button>
						</div>
					</div>

					{/* Description */}
					{skill.description && (
						<div className="mb-6">
							<h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
								{t("description")}
							</h3>
							<p className="text-sm text-foreground">
								{skill.description}
							</p>
						</div>
					)}

					{/* Locations */}
					<div className="mb-6">
						<h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
							{t("locations")} ({group.items.length})
						</h3>

						{globalItems.length > 0 && (
							<div className="mb-4">
								<h4 className="text-xs text-muted mb-2">
									{t("globalSkills")}
								</h4>
								<div className="space-y-2">
									{globalItems.map((item) => (
										<LocationItem
											key={item.agent}
											item={item}
											onOpenFolder={handleOpenFolder}
										/>
									))}
								</div>
							</div>
						)}

						{projectItems.length > 0 && (
							<div>
								<h4 className="text-xs text-muted mb-2">
									{t("projectSkills")}
								</h4>
								<div className="space-y-2">
									{projectItems.map((item) => (
										<LocationItem
											key={item.agent}
											item={item}
											onOpenFolder={handleOpenFolder}
										/>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Metadata */}
					{(skill.author || skill.version) && (
						<div className="mb-6">
							<h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
								{t("metadata")}
							</h3>
							<div className="flex gap-6">
								{skill.author && (
									<div>
										<span className="text-xs text-muted block mb-0.5">
											{t("author")}
										</span>
										<span className="text-sm text-foreground">
											{skill.author}
										</span>
									</div>
								)}
								{skill.version && (
									<div>
										<span className="text-xs text-muted block mb-0.5">
											{t("version")}
										</span>
										<span className="text-sm text-foreground font-mono">
											{skill.version}
										</span>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Tools */}
					{skill.tools.length > 0 && (
						<div className="mb-6">
							<h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
								{t("tools")} ({skill.tools.length})
							</h3>
							<div className="flex flex-wrap gap-1.5">
								{skill.tools.map((tool) => (
									<Chip key={tool} size="sm">
										{tool}
									</Chip>
								))}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Edit Dialog */}
			<EditSkillDialog
				group={group}
				isOpen={editDialogOpen}
				onClose={() => setEditDialogOpen(false)}
				projectPath={projectPath}
			/>

			{/* Delete Dialog */}
			<DeleteSkillDialog
				group={group}
				isOpen={deleteDialogOpen}
				onClose={() => setDeleteDialogOpen(false)}
				projectPath={projectPath}
			/>
		</>
	);
}

interface LocationItemProps {
	item: SkillResponse;
	onOpenFolder: (sourcePath?: string) => void;
}

function LocationItem({ item, onOpenFolder }: LocationItemProps) {
	const { t } = useTranslation();

	const agentDisplayName = item.agent
		? item.agent.charAt(0).toUpperCase() + item.agent.slice(1).toLowerCase()
		: t("default");

	return (
		<div className="flex items-center justify-between gap-3 p-3 bg-default-50 rounded-lg border border-border">
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2 mb-1">
					<Chip size="sm" variant="secondary">
						{agentDisplayName}
					</Chip>
				</div>
				{item.source_path && (
					<p className="text-xs text-muted font-mono truncate">
						{item.source_path}
					</p>
				)}
			</div>
			{item.source_path && (
				<Button
					isIconOnly
					variant="ghost"
					size="sm"
					className="text-muted hover:text-foreground shrink-0"
					aria-label={t("openFolder")}
					onPress={() => onOpenFolder(item.source_path)}
				>
					<FolderIcon className="size-4" />
				</Button>
			)}
		</div>
	);
}

interface EditSkillDialogProps {
	group: SkillGroup;
	isOpen: boolean;
	onClose: () => void;
	projectPath?: string;
}

function EditSkillDialog({
	group,
	isOpen,
	onClose,
	projectPath,
}: EditSkillDialogProps) {
	const { t } = useTranslation();
	const { baseUrl } = useServer();
	const api = createApi(baseUrl);
	const queryClient = useQueryClient();

	const skill = group.items[0];

	const [formData, setFormData] = useState({
		description: skill.description ?? "",
		author: skill.author ?? "",
		version: skill.version ?? "",
		tools: skill.tools.join(", "),
	});

	const updateMutation = useMutation({
		mutationFn: async (data: typeof formData) => {
			const results = await Promise.all(
				group.items.map(async (item) => {
					if (!item.agent) return null;
					const scope =
						item.source === ConfigSource.Project ? "project" : "global";
					return api.skills.update(
						item.agent,
						skill.name,
						{
							description: data.description || undefined,
							author: data.author || undefined,
							version: data.version || undefined,
							tools: data.tools
								.split(",")
								.map((t) => t.trim())
								.filter(Boolean),
						},
						scope,
						projectPath,
					);
				}),
			);
			return results;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["skills"] });
			queryClient.invalidateQueries({ queryKey: ["project-skills"] });
			onClose();
		},
	});

	const handleSubmit = () => {
		updateMutation.mutate(formData);
	};

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onClose}>
			<Modal.Container>
				<Modal.Dialog className="max-w-lg">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Heading>{t("editSkill")}</Modal.Heading>
					</Modal.Header>

					<Modal.Body className="p-2 space-y-4">
						<p className="text-sm text-muted">
							{t("affectsAllAgents")}: {group.items.length}{" "}
							{t("locations")}
						</p>

						<Fieldset>
							<Fieldset.Group>
								<TextField className="w-full">
									<Label>{t("description")}</Label>
									<TextArea
										value={formData.description}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												description: e.target.value,
											}))
										}
										className="min-h-[80px]"
									/>
								</TextField>
							</Fieldset.Group>
						</Fieldset>

						<Fieldset>
							<Fieldset.Group>
								<TextField className="w-full">
									<Label>{t("author")}</Label>
									<Input
										value={formData.author}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												author: e.target.value,
											}))
										}
									/>
								</TextField>
							</Fieldset.Group>
						</Fieldset>

						<Fieldset>
							<Fieldset.Group>
								<TextField className="w-full">
									<Label>{t("version")}</Label>
									<Input
										value={formData.version}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												version: e.target.value,
											}))
										}
									/>
								</TextField>
							</Fieldset.Group>
						</Fieldset>

						<Fieldset>
							<Fieldset.Group>
								<TextField className="w-full">
									<Label>{t("tools")}</Label>
									<Input
										value={formData.tools}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												tools: e.target.value,
											}))
										}
									/>
									<Description>{t("toolsDescription")}</Description>
								</TextField>
							</Fieldset.Group>
						</Fieldset>
					</Modal.Body>

					<Modal.Footer>
						<Button slot="close" variant="secondary">
							{t("cancel")}
						</Button>
						<Button
							onPress={handleSubmit}
							isDisabled={updateMutation.isPending}
						>
							{updateMutation.isPending ? (
								<>
									<Spinner size="sm" className="mr-2" />
									{t("saving")}
								</>
							) : (
								t("saveChanges")
							)}
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

interface DeleteSkillDialogProps {
	group: SkillGroup;
	isOpen: boolean;
	onClose: () => void;
	projectPath?: string;
}

function DeleteSkillDialog({
	group,
	isOpen,
	onClose,
	projectPath,
}: DeleteSkillDialogProps) {
	const { t } = useTranslation();
	const { baseUrl } = useServer();
	const api = createApi(baseUrl);
	const queryClient = useQueryClient();

	const skill = group.items[0];

	const deleteMutation = useMutation({
		mutationFn: async () => {
			await Promise.all(
				group.items.map(async (item) => {
					if (!item.agent) return;
					const scope =
						item.source === ConfigSource.Project ? "project" : "global";
					return api.skills.delete(
						item.agent,
						skill.name,
						scope,
						projectPath,
					);
				}),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["skills"] });
			queryClient.invalidateQueries({ queryKey: ["project-skills"] });
			onClose();
		},
	});

	const globalItems = group.items.filter(
		(item) => item.source === ConfigSource.Global,
	);
	const projectItems = group.items.filter(
		(item) => item.source === ConfigSource.Project,
	);

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onClose}>
			<Modal.Container>
				<Modal.Dialog>
					<Modal.CloseTrigger />
					<Modal.Header>
						<div className="flex items-center gap-2">
							<ExclamationTriangleIcon className="size-5 text-warning" />
							<Modal.Heading>{t("deleteSkill")}</Modal.Heading>
						</div>
					</Modal.Header>

					<Modal.Body className="p-2">
						<p className="text-sm text-muted mb-4">
							{t("deleteSkillWarning", { count: group.items.length })}
						</p>

						<div className="space-y-4">
							{globalItems.length > 0 && (
								<div>
									<h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
										{t("globalSkills")}
									</h4>
									<div className="space-y-2">
										{globalItems.map((item) => (
											<div
												key={item.agent}
												className="flex items-center gap-2 text-sm"
											>
												<XCircleIcon className="size-4 text-danger shrink-0" />
												<span className="text-foreground">
													{item.agent
														? item.agent
																.charAt(0)
																.toUpperCase() +
															item.agent
																.slice(1)
																.toLowerCase()
														: t("default")}
												</span>
												{item.source_path && (
													<span className="text-muted text-xs truncate flex-1">
														{item.source_path}
													</span>
												)}
											</div>
										))}
									</div>
								</div>
							)}

							{projectItems.length > 0 && (
								<div>
									<h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
										{t("projectSkills")}
									</h4>
									<div className="space-y-2">
										{projectItems.map((item) => (
											<div
												key={item.agent}
												className="flex items-center gap-2 text-sm"
											>
												<XCircleIcon className="size-4 text-danger shrink-0" />
												<span className="text-foreground">
													{item.agent
														? item.agent
																.charAt(0)
																.toUpperCase() +
															item.agent
																.slice(1)
																.toLowerCase()
														: t("default")}
												</span>
												{item.source_path && (
													<span className="text-muted text-xs truncate flex-1">
														{item.source_path}
													</span>
												)}
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</Modal.Body>

					<Modal.Footer>
						<Button
							slot="close"
							variant="secondary"
							onPress={onClose}
							isDisabled={deleteMutation.isPending}
						>
							{t("cancel")}
						</Button>
						<Button
							variant="danger"
							onPress={() => deleteMutation.mutate()}
							isDisabled={deleteMutation.isPending}
						>
							{deleteMutation.isPending ? (
								<>
									<Spinner size="sm" className="mr-2" />
									{t("deleting")}
								</>
							) : (
								t("deleteAll")
							)}
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
