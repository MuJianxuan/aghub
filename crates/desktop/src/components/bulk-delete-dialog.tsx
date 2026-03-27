import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { Button, Modal, Spinner } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useServer } from "../hooks/use-server";
import { createApi } from "../lib/api";
import { ConfigSource } from "../lib/api-types";

interface BulkDeleteItem {
	name: string;
	agent?: string;
	source?: ConfigSource;
}

interface BulkDeleteDialogProps {
	groups: { key: string; items: BulkDeleteItem[] }[];
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	resourceType: "mcp" | "skill";
}

export function BulkDeleteDialog({
	groups,
	isOpen,
	onClose,
	onSuccess,
	resourceType,
}: BulkDeleteDialogProps) {
	const { t } = useTranslation();
	const { baseUrl } = useServer();
	const api = useMemo(() => createApi(baseUrl), [baseUrl]);
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: async () => {
			const promises: Promise<void>[] = [];
			const deleteInfo: Array<{
				name: string;
				agent: string;
				scope: string;
			}> = [];
			for (const group of groups) {
				for (const item of group.items) {
					if (!item.agent) continue;
					const scope =
						item.source === ConfigSource.Project
							? "project"
							: "global";
					const typedScope = scope as "global" | "project";
					if (resourceType === "mcp") {
						promises.push(
							api.mcps.delete(item.name, item.agent, typedScope),
						);
					} else {
						promises.push(
							api.skills.delete(
								item.agent,
								group.key,
								typedScope,
							),
						);
					}
					deleteInfo.push({
						name: item.name,
						agent: item.agent,
						scope,
					});
				}
			}
			const results = await Promise.allSettled(promises);
			const failures = results
				.map((r, i) => ({ result: r, info: deleteInfo[i] }))
				.filter(({ result }) => result.status === "rejected")
				.map(({ result, info }) => ({
					...info,
					reason: (result as PromiseRejectedResult).reason,
				}));
			if (failures.length > 0) {
				console.error(
					`${resourceType} bulk delete failures:`,
					failures,
				);
				throw new Error(
					`${failures.length} of ${promises.length} deletions failed`,
				);
			}
			return { deleted: promises.length };
		},
		onSuccess: () => {
			if (resourceType === "mcp") {
				queryClient.invalidateQueries({ queryKey: ["mcps"] });
				queryClient.invalidateQueries({
					queryKey: ["project-mcps"],
				});
			} else {
				queryClient.invalidateQueries({ queryKey: ["skills"] });
				queryClient.invalidateQueries({
					queryKey: ["project-skills"],
				});
			}
		},
		onError: (error) => {
			console.error("Bulk delete mutation error:", error);
		},
		onSettled: () => {
			onClose();
			onSuccess();
		},
	});

	const confirmKey =
		resourceType === "mcp"
			? "bulkDeleteMcpConfirm"
			: "bulkDeleteSkillConfirm";

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onClose}>
			<Modal.Container>
				<Modal.Dialog>
					<Modal.CloseTrigger />
					<Modal.Header>
						<div className="flex items-center gap-2">
							<ExclamationTriangleIcon className="size-5 text-warning" />
							<Modal.Heading>
								{t("bulkDeleteConfirmTitle")}
							</Modal.Heading>
						</div>
					</Modal.Header>
					<Modal.Body>
						<p className="text-sm text-muted">
							{t(confirmKey, {
								count: groups.length,
							})}
						</p>
					</Modal.Body>
					<Modal.Footer>
						<Button
							slot="close"
							variant="secondary"
							size="md"
							onPress={onClose}
							isDisabled={deleteMutation.isPending}
							className="min-h-[44px]"
						>
							{t("cancel")}
						</Button>
						<Button
							variant="danger"
							size="md"
							onPress={() => deleteMutation.mutate()}
							isDisabled={deleteMutation.isPending}
							className="min-h-[44px] min-w-[120px]"
						>
							{deleteMutation.isPending ? (
								<Spinner size="sm" />
							) : (
								t("deleteSelected")
							)}
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
