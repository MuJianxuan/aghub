import {
	ComputerDesktopIcon,
	MoonIcon,
	SunIcon,
	UserGroupIcon,
} from "@heroicons/react/24/solid";
import {
	Button,
	ListBox,
	SearchField,
	Select,
	Tabs,
	ToggleButton,
	ToggleButtonGroup,
} from "@heroui/react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AgentCard } from "../../components/agent-card";
import { disableAgent, enableAgent } from "../../lib/store";
import { useAgentAvailability } from "../../hooks/use-agent-availability";
import { useTheme } from "../../hooks/use-theme";
import IntegrationsPanel from "./integrations-panel";

export default function SettingsPage() {
	const { t, i18n } = useTranslation();
	const { theme, setTheme } = useTheme();
	const { availableAgents, refreshDisabledAgents } = useAgentAvailability();
	const [updating, setUpdating] = useState<string | null>(null);
	const [selectedTab, setSelectedTab] = useQueryState("tab", {
		defaultValue: "appearance",
	});
	const [agentFilter, setAgentFilter] = useState<"all" | "enabled" | "disabled">("all");
	const [agentSearch, setAgentSearch] = useState("");

	const changeLanguage = (lng: string) => {
		i18n.changeLanguage(lng);
		localStorage.setItem("language", lng);
	};

	const handleToggleAgent = async (
		agentId: string,
		currentlyDisabled: boolean,
	) => {
		setUpdating(agentId);
		try {
			if (currentlyDisabled) {
				await enableAgent(agentId);
			} else {
				await disableAgent(agentId);
			}
			await refreshDisabledAgents();
		} finally {
			setUpdating(null);
		}
	};

	return (
		<div className="h-full overflow-y-auto">
			<div className="max-w-3xl p-6">
				<Tabs
					selectedKey={selectedTab}
					onSelectionChange={(key) => {
						setSelectedTab(key as string);
					}}
				>
					<div className="mb-2 flex items-center justify-between">
						<h2 className="text-xl font-semibold">
							{t("settings")}
						</h2>

						<Tabs.ListContainer>
							<Tabs.List
								aria-label="Settings sections"
								className="inline-flex w-auto"
							>
								<Tabs.Tab id="appearance">
									{t("appearance")}
									<Tabs.Indicator />
								</Tabs.Tab>
								<Tabs.Tab id="agents">
									{t("agentManagement")}
									<Tabs.Indicator />
								</Tabs.Tab>
								<Tabs.Tab id="integrations">
									{t("integrations")}
									<Tabs.Indicator />
								</Tabs.Tab>
							</Tabs.List>
						</Tabs.ListContainer>
					</div>

					<Tabs.Panel id="appearance">
						<div className="space-y-2">
							{/* Theme Setting */}
							<div className="rounded-lg bg-(--surface) p-4">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<span className="text-sm font-medium text-(--foreground)">
											{t("theme")}
										</span>
										<span className="block text-xs text-(--muted)">
											{t("themeDescription")}
										</span>
									</div>
									<ToggleButtonGroup
										selectedKeys={[theme]}
										onSelectionChange={(keys) =>
											setTheme(
												[...keys][0] as
													| "light"
													| "dark"
													| "system",
											)
										}
										selectionMode="single"
										disallowEmptySelection
										size="sm"
									>
										<ToggleButton
											id="light"
											aria-label={t("light")}
										>
											<SunIcon className="size-4" />
											{t("light")}
										</ToggleButton>
										<ToggleButtonGroup.Separator />
										<ToggleButton
											id="dark"
											aria-label={t("dark")}
										>
											<MoonIcon className="size-4" />
											{t("dark")}
										</ToggleButton>
										<ToggleButtonGroup.Separator />
										<ToggleButton
											id="system"
											aria-label={t("system")}
										>
											<ComputerDesktopIcon className="size-4" />
											{t("system")}
										</ToggleButton>
									</ToggleButtonGroup>
								</div>
							</div>

							{/* Language Setting */}
							<div className="rounded-lg bg-(--surface) p-4">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<span className="text-sm font-medium text-(--foreground)">
											{t("language")}
										</span>
										<span className="block text-xs text-(--muted)">
											{t("languageDescription")}
										</span>
									</div>
									<Select
										value={
											i18n.language.startsWith("zh")
												? "zh"
												: "en"
										}
										onChange={(key) =>
											changeLanguage(key as string)
										}
										aria-label={t("language")}
										className="min-w-40"
									>
										<Select.Trigger>
											<Select.Value />
											<Select.Indicator />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												<ListBox.Item
													id="en"
													textValue={t("english")}
												>
													{t("english")}
												</ListBox.Item>
												<ListBox.Item
													id="zh"
													textValue={t("chinese")}
												>
													{t("chinese")}
												</ListBox.Item>
											</ListBox>
										</Select.Popover>
									</Select>
								</div>
							</div>
						</div>
					</Tabs.Panel>

					<Tabs.Panel id="agents">
						{(() => {
							let filteredAgents = availableAgents.filter(
								(agent) => agent.availability.is_available,
							);

							// Apply search filter
							if (agentSearch.trim()) {
								const search = agentSearch.toLowerCase();
								filteredAgents = filteredAgents.filter(
									(agent) =>
										agent.display_name.toLowerCase().includes(search) ||
										agent.id.toLowerCase().includes(search),
								);
							}

							// Apply status filter
							if (agentFilter === "enabled") {
								filteredAgents = filteredAgents.filter((agent) => !agent.isDisabled);
							} else if (agentFilter === "disabled") {
								filteredAgents = filteredAgents.filter((agent) => agent.isDisabled);
							}

							return (
								<div className="space-y-3">
									{/* Search and Filter Bar */}
									<div className="
           flex flex-col gap-2
           sm:flex-row sm:items-center sm:justify-between
         ">
										<SearchField
											value={agentSearch}
											onChange={setAgentSearch}
											className="
             w-full
             sm:w-64
           "
										>
											<SearchField.Group>
												<SearchField.SearchIcon />
												<SearchField.Input placeholder={t("searchAgents")} />
												<SearchField.ClearButton />
											</SearchField.Group>
										</SearchField>
										<div className="flex gap-1">
											<Button
												size="sm"
												variant={agentFilter === "all" ? "primary" : "ghost"}
												onPress={() => setAgentFilter("all")}
											>
												{t("all")}
											</Button>
											<Button
												size="sm"
												variant={agentFilter === "enabled" ? "primary" : "ghost"}
												onPress={() => setAgentFilter("enabled")}
											>
												{t("enabled")}
											</Button>
											<Button
												size="sm"
												variant={agentFilter === "disabled" ? "primary" : "ghost"}
												onPress={() => setAgentFilter("disabled")}
											>
												{t("disabled")}
											</Button>
										</div>
									</div>

									{/* Agents Grid */}
									{filteredAgents.length === 0 ? (
										<div className="
            flex flex-col items-center justify-center rounded-lg bg-(--surface)
            py-16 text-center
          ">
											<div className="mb-4 text-(--muted)">
												<UserGroupIcon className="mx-auto size-12" />
											</div>
											<p className="text-sm font-medium text-(--foreground)">
												{agentSearch || agentFilter !== "all"
													? t("noAgentsMatch")
													: t("noAgentsAvailable")}
											</p>
											<p className="mt-1 max-w-sm text-xs text-(--muted)">
												{agentSearch || agentFilter !== "all"
													? t("adjustFiltersDescription")
													: t("noAgentsDescription")}
											</p>
										</div>
									) : (
										<div className="
            grid grid-cols-1 gap-3
            sm:grid-cols-2
          ">
											{filteredAgents.map((agent) => (
												<AgentCard
													key={agent.id}
													agent={agent}
													isUpdating={updating === agent.id}
													onToggle={handleToggleAgent}
												/>
											))}
										</div>
									)}
								</div>
							);
						})()}
					</Tabs.Panel>

					<Tabs.Panel id="integrations">
						<IntegrationsPanel />
					</Tabs.Panel>
				</Tabs>
			</div>
		</div>
	);
}
