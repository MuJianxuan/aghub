import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createApi } from "../lib/api";
import { useServer } from "../providers/server";

const CODE_EDITORS_KEY = "code-editors";
const TERMINALS_KEY = "terminals";

export function useCodeEditors() {
	const { baseUrl } = useServer();
	const api = createApi(baseUrl);
	return useQuery({
		queryKey: [CODE_EDITORS_KEY],
		queryFn: () => api.integrations.listCodeEditors(),
	});
}

export function useTerminals() {
	const { baseUrl } = useServer();
	const api = createApi(baseUrl);
	return useQuery({
		queryKey: [TERMINALS_KEY],
		queryFn: () => api.integrations.listTerminals(),
	});
}

export function useRefreshIntegrations() {
	const queryClient = useQueryClient();
	return () => {
		queryClient.invalidateQueries({ queryKey: [CODE_EDITORS_KEY] });
		queryClient.invalidateQueries({ queryKey: [TERMINALS_KEY] });
	};
}

export function useOpenWithEditor() {
	const { baseUrl } = useServer();
	const api = createApi(baseUrl);
	return useMutation({
		mutationFn: ({
			path,
			editor,
			terminal,
		}: {
			path: string;
			editor: string;
			terminal?: string;
		}) =>
			api.integrations.openWithEditor(
				path,
				editor as import("../lib/api-types").CodeEditorType,
				terminal as import("../lib/api-types").TerminalType | undefined,
			),
	});
}

export function useOpenInTerminal() {
	const { baseUrl } = useServer();
	const api = createApi(baseUrl);
	return useMutation({
		mutationFn: ({ path, terminal }: { path: string; terminal: string }) =>
			api.integrations.openInTerminal(
				path,
				terminal as import("../lib/api-types").TerminalType,
			),
	});
}
