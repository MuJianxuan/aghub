import {
	CommandLineIcon,
	ComputerDesktopIcon,
	WrenchScrewdriverIcon,
} from "@heroicons/react/24/solid";
import { Button, Card, Spinner } from "@heroui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	useCodeEditors,
	useOpenInTerminal,
	useOpenWithEditor,
	useRefreshIntegrations,
	useTerminals,
} from "../../hooks/use-integrations";
import {
	getIntegrationPreferences,
	saveIntegrationPreferences,
} from "../../lib/store";
import type { CodeEditorType, TerminalType } from "../../lib/api-types";

interface ToolCardProps {
	id: string;
	name: string;
	installed: boolean;
	selected: boolean;
	onSelect: () => void;
	icon: React.ReactNode;
}

function ToolCard({
	name,
	installed,
	selected,
	onSelect,
	icon,
}: ToolCardProps) {
	return (
		<Card
			className={`flex-1 min-w-[140px] transition-all cursor-pointer ${
				selected
					? "ring-2 ring-accent bg-accent/5"
					: "hover:bg-surface-secondary"
			} ${!installed ? "opacity-60" : ""}`}
			onClick={onSelect}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					onSelect();
				}
			}}
			role="button"
			tabIndex={0}
		>
			<Card.Content className="p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-surface-secondary text-foreground">
							{icon}
						</div>
						<div>
							<div className="font-medium text-sm">{name}</div>
							<div className="text-xs text-muted mt-0.5">
								{installed ? (
									<span className="text-success">Installed</span>
								) : (
									<span className="text-muted">Not Installed</span>
								)}
							</div>
						</div>
					</div>
					<div
						className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
							selected
								? "border-accent bg-accent"
								: "border-muted"
						}`}
					>
						{selected && (
							<div className="w-2 h-2 rounded-full bg-accent-foreground" />
						)}
					</div>
				</div>
			</Card.Content>
		</Card>
	);
}

export default function IntegrationsPage() {
	const { t } = useTranslation();
	const { data: codeEditors, isLoading: isLoadingEditors } = useCodeEditors();
	const { data: terminals, isLoading: isLoadingTerminals } = useTerminals();
	const refreshIntegrations = useRefreshIntegrations();

	const [selectedEditor, setSelectedEditor] = useState<CodeEditorType | null>(
		null,
	);
	const [selectedTerminal, setSelectedTerminal] = useState<TerminalType | null>(
		null,
	);
	const [isSaving, setIsSaving] = useState(false);

	const openWithEditor = useOpenWithEditor();
	const openInTerminal = useOpenInTerminal();

	useEffect(() => {
		async function loadPreferences() {
			const prefs = await getIntegrationPreferences();
			if (prefs.codeEditor) setSelectedEditor(prefs.codeEditor);
			if (prefs.terminal) setSelectedTerminal(prefs.terminal);
		}
		loadPreferences();
	}, []);

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await saveIntegrationPreferences({
				codeEditor: selectedEditor || undefined,
				terminal: selectedTerminal || undefined,
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleTestEditor = async () => {
		if (!selectedEditor) return;
		await openWithEditor.mutateAsync({
			path: "~",
			editor: selectedEditor,
			terminal: selectedTerminal || undefined,
		});
	};

	const handleTestTerminal = async () => {
		if (!selectedTerminal) return;
		await openInTerminal.mutateAsync({
			path: "~",
			terminal: selectedTerminal,
		});
	};

	const isLoading = isLoadingEditors || isLoadingTerminals;

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<div className="h-full overflow-y-auto">
			<div className="p-6 max-w-3xl">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="text-xl font-semibold">
							{t("integrations")}
						</h2>
						<p className="text-sm text-muted mt-1">
							{t("integrationsDescription")}
						</p>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onPress={refreshIntegrations}
						isDisabled={isLoading}
					>
						{t("refresh")}
					</Button>
				</div>

				<section className="mb-8">
					<div className="flex items-center gap-2 mb-4">
						<WrenchScrewdriverIcon className="size-5 text-accent" />
						<h3 className="text-lg font-medium">{t("codeEditors")}</h3>
					</div>
					<p className="text-sm text-muted mb-4">
						{t("codeEditorsDescription")}
					</p>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{codeEditors?.map((editor) => (
							<ToolCard
								key={editor.id}
								id={editor.id}
								name={editor.name}
								installed={editor.installed}
								selected={selectedEditor === editor.id}
								onSelect={() =>
									setSelectedEditor(editor.id as CodeEditorType)
								}
								icon={<ComputerDesktopIcon className="size-5" />}
							/>
						))}
					</div>

					{selectedEditor === "vim" && (
						<div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
							<p className="text-sm text-warning">
								{t("vimRequiresTerminal")}
							</p>
						</div>
					)}

					{selectedEditor && (
						<div className="mt-4">
							<Button
								variant="outline"
								size="sm"
								onPress={handleTestEditor}
								isDisabled={
									openWithEditor.isPending ||
									(selectedEditor === "vim" && !selectedTerminal)
								}
							>
								{openWithEditor.isPending ? (
									<Spinner size="sm" />
								) : (
									t("testEditor")
								)}
							</Button>
						</div>
					)}
				</section>

				<section className="mb-8">
					<div className="flex items-center gap-2 mb-4">
						<CommandLineIcon className="size-5 text-accent" />
						<h3 className="text-lg font-medium">{t("terminals")}</h3>
					</div>
					<p className="text-sm text-muted mb-4">
						{t("terminalsDescription")}
					</p>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{terminals?.map((terminal) => (
							<ToolCard
								key={terminal.id}
								id={terminal.id}
								name={terminal.name}
								installed={terminal.installed}
								selected={selectedTerminal === terminal.id}
								onSelect={() =>
									setSelectedTerminal(terminal.id as TerminalType)
								}
								icon={<CommandLineIcon className="size-5" />}
							/>
						))}
					</div>

					{selectedTerminal && (
						<div className="mt-4">
							<Button
								variant="outline"
								size="sm"
								onPress={handleTestTerminal}
								isDisabled={openInTerminal.isPending}
							>
								{openInTerminal.isPending ? (
									<Spinner size="sm" />
								) : (
									t("testTerminal")
								)}
							</Button>
						</div>
					)}
				</section>

				<div className="flex justify-end pt-4 border-t border-border">
					<Button
						variant="primary"
						onPress={handleSave}
						isDisabled={isSaving}
					>
						{isSaving ? <Spinner size="sm" /> : t("save")}
					</Button>
				</div>
			</div>
		</div>
	);
}
