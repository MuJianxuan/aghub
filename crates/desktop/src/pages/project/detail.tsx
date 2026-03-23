import {
	CommandLineIcon,
	CubeIcon,
	FolderIcon,
} from "@heroicons/react/24/solid";
import { Skeleton } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useParams } from "wouter";
import { useProjectStats } from "../../hooks/use-project-stats";
import { useProjects } from "../../hooks/use-projects";

interface StatCardProps {
	icon: React.ReactNode;
	label: string;
	value: number;
	isLoading?: boolean;
}

function StatCard({ icon, label, value, isLoading }: StatCardProps) {
	return (
		<div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-surface-secondary">
			<div className="flex items-center justify-center w-10 h-10 rounded-md bg-accent/10 text-accent shrink-0">
				{icon}
			</div>
			<div className="min-w-0 flex-1">
				<p className="text-xs text-muted uppercase tracking-wide truncate">
					{label}
				</p>
				{isLoading ? (
					<Skeleton className="h-6 w-12 mt-1" />
				) : (
					<p className="text-2xl font-semibold mt-0.5">{value}</p>
				)}
			</div>
		</div>
	);
}

export default function ProjectDetailPage() {
	const { t } = useTranslation();
	const { id } = useParams();
	const { data: projects = [] } = useProjects();
	const project = projects.find((p) => p.id === id);
	const { data: stats, isLoading: statsLoading } = useProjectStats(
		project?.path,
	);

	if (!project) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-sm text-muted">{t("projectNotFound")}</p>
			</div>
		);
	}

	return (
		<div className="h-full overflow-y-auto">
			<div className="p-6 max-w-4xl">
					<div className="mb-8">
					<div className="flex items-center gap-3 mb-2">
						<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 text-accent">
							<FolderIcon className="size-5" />
						</div>
						<h1 className="text-2xl font-semibold truncate">
							{project.name}
						</h1>
					</div>
					<p className="text-sm text-muted ml-13 pl-0.5 font-mono truncate">
						{project.path}
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<StatCard
						icon={<CubeIcon className="size-5" />}
						label={t("skills")}
						value={stats?.skillsCount ?? 0}
						isLoading={statsLoading}
					/>
					<StatCard
						icon={<CommandLineIcon className="size-5" />}
						label={t("mcps")}
						value={stats?.mcpsCount ?? 0}
						isLoading={statsLoading}
					/>
				</div>
			</div>
		</div>
	);
}
