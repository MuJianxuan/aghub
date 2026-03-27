import { Button, Checkbox, Label, ListBox, Modal, Select } from "@heroui/react";
import type { Key } from "react-aria-components";
import { useTranslation } from "react-i18next";
import { AgentSelector } from "../../../components/agent-selector";
import { ResultStatusItem } from "../../../components/result-status-item";
import { SkillInfoCard } from "../../../components/skill-info-card";
import type { MarketSkill } from "../../../lib/api-types";
import type { Project } from "../../../lib/store";
import type { InstallResult } from "../hooks/use-skill-install";

interface InstallModalProps {
	isOpen: boolean;
	selectedSkill: MarketSkill | null;
	selectedAgents: Set<string>;
	onSelectedAgentsChange: (agents: Set<string>) => void;
	installResults: InstallResult[];
	isInstalling: boolean;
	skillAgents: ReturnType<
		typeof import("../hooks/use-skill-install").useSkillInstall
	>["skillAgents"];
	installAll: boolean;
	onInstallAllChange: (value: boolean) => void;
	installToProject: boolean;
	onInstallToProjectChange: (value: boolean) => void;
	selectedProjectId: string | null;
	onSelectedProjectIdChange: (id: string | null) => void;
	projects: Project[];
	onClose: () => void;
	onInstall: () => void;
}

export function InstallModal({
	isOpen,
	selectedSkill,
	selectedAgents,
	onSelectedAgentsChange,
	installResults,
	isInstalling,
	skillAgents,
	installAll,
	onInstallAllChange,
	installToProject,
	onInstallToProjectChange,
	selectedProjectId,
	onSelectedProjectIdChange,
	projects,
	onClose,
	onInstall,
}: InstallModalProps) {
	const { t } = useTranslation();

	const handleProjectChange = (key: Key | null) => {
		onSelectedProjectIdChange(key as string | null);
	};

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onClose}>
			<Modal.Container>
				<Modal.Dialog className="max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Heading>{t("installSkill")}</Modal.Heading>
					</Modal.Header>

					<Modal.Body className="p-2">
						{selectedSkill && (
							<SkillInfoCard
								name={
									installAll ? undefined : selectedSkill.name
								}
								source={selectedSkill.source}
								className="mb-4"
							/>
						)}

						{installResults.length === 0 && (
							<div className="space-y-4">
								<p className="text-sm text-muted">
									{t("selectAgentsForSkill")}
								</p>
								<AgentSelector
									agents={skillAgents}
									selectedKeys={selectedAgents}
									onSelectionChange={onSelectedAgentsChange}
									emptyMessage={t("noTargetAgents")}
									showSelectedIcon
									variant="secondary"
								/>

								{installToProject && (
									<Select
										variant="secondary"
										selectedKey={selectedProjectId}
										onSelectionChange={handleProjectChange}
										aria-label={t("selectProject")}
										className="w-full"
									>
										<Select.Trigger>
											<Select.Value />
											<Select.Indicator />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{projects.length === 0 ? (
													<ListBox.Item
														id="empty"
														textValue={t(
															"noProjects",
														)}
														isDisabled
													>
														<span className="text-muted">
															{t("noProjects")}
														</span>
													</ListBox.Item>
												) : (
													projects.map((project) => (
														<ListBox.Item
															key={project.id}
															id={project.id}
															textValue={
																project.name
															}
														>
															{project.name}
														</ListBox.Item>
													))
												)}
											</ListBox>
										</Select.Popover>
									</Select>
								)}

								<Checkbox
									value="installAll"
									isSelected={installAll}
									onChange={(isSelected) =>
										onInstallAllChange(isSelected)
									}
									variant="secondary"
								>
									<Checkbox.Control>
										<Checkbox.Indicator />
									</Checkbox.Control>
									<Checkbox.Content className="flex flex-col items-start gap-0.5">
										<Label className="text-sm font-medium">
											{t("installAllSkills")}
										</Label>
										<span className="text-xs text-muted">
											{t("installAllSkillsDescription")}
										</span>
									</Checkbox.Content>
								</Checkbox>

								<Checkbox
									value="installToProject"
									isSelected={installToProject}
									onChange={(isSelected) =>
										onInstallToProjectChange(isSelected)
									}
									variant="secondary"
								>
									<Checkbox.Control>
										<Checkbox.Indicator />
									</Checkbox.Control>
									<Checkbox.Content className="flex flex-col items-start gap-0.5">
										<Label className="text-sm font-medium">
											{t("installToProject")}
										</Label>
										<span className="text-xs text-muted">
											{t("installToProjectDescription")}
										</span>
									</Checkbox.Content>
								</Checkbox>
							</div>
						)}

						{installResults.length > 0 && (
							<div className="space-y-3">
								{installResults.map((result) => (
									<ResultStatusItem
										key={result.agentId}
										displayName={result.displayName}
										status={result.status}
										statusText={
											result.status === "pending"
												? t("installing")
												: result.status === "success"
													? t("installSuccess")
													: ""
										}
										error={result.error}
									/>
								))}
							</div>
						)}
					</Modal.Body>

					<Modal.Footer>
						{installResults.length === 0 && (
							<>
								<Button slot="close" variant="secondary">
									{t("cancel")}
								</Button>
								<Button
									onPress={onInstall}
									isDisabled={
										selectedAgents.size === 0 ||
										isInstalling ||
										(installToProject && !selectedProjectId)
									}
								>
									{isInstalling
										? t("installing")
										: t("install")}
								</Button>
							</>
						)}
						{installResults.length > 0 && (
							<Button slot="close" variant="secondary">
								{t("done")}
							</Button>
						)}
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
