import ky from "ky";
import type {
	CodeEditorType,
	CreateSkillRequest,
	InstallSkillRequest,
	InstallSkillResponse,
	MarketSkill,
	McpResponse,
	SkillResponse,
	TerminalType,
	ToolInfo,
	TransportDto,
} from "./api-types";

export interface UpdateSkillRequest {
	description?: string;
	author?: string;
	version?: string;
	tools?: string[];
}

export interface UpdateMcpRequest {
	name?: string;
	transport?: TransportDto;
	enabled?: boolean;
	timeout?: number;
}

export interface AgentInfo {
	id: string;
	display_name: string;
	capabilities: {
		mcp_stdio: boolean;
		mcp_remote: boolean;
		mcp_enable_disable: boolean;
		skills: boolean;
		skills_mutable: boolean;
		universal_skills: boolean;
	};
	skills_cli_name?: string;
}

export interface AgentAvailability {
	id: string;
	has_global_directory: boolean;
	has_cli: boolean;
	is_available: boolean;
}

export function createApi(baseUrl: string) {
	const client = ky.create({ prefixUrl: baseUrl });

	return {
		agents: {
			list(): Promise<AgentInfo[]> {
				return client.get("agents").json();
			},
			availability(): Promise<AgentAvailability[]> {
				return client.get("agents/availability").json();
			},
		},
		skills: {
			listAll(
				scope: "global" | "project" | "all" = "global",
				projectRoot?: string,
			): Promise<SkillResponse[]> {
				return client
					.get("agents/all/skills", {
						searchParams: {
							scope,
							...(projectRoot
								? { project_root: projectRoot }
								: {}),
						},
					})
					.json();
			},
		create(
			agent: string,
			data: CreateSkillRequest,
			projectRoot?: string,
		): Promise<SkillResponse> {
			const scope = projectRoot ? "project" : "global";
			return client
				.post(`agents/${agent}/skills`, {
					searchParams: {
						scope,
						...(projectRoot
							? { project_root: projectRoot }
							: {}),
					},
					json: data,
				})
				.json();
		},
		install(data: InstallSkillRequest): Promise<InstallSkillResponse> {
			return client
				.post("skills/install", { json: data, timeout: 300000 })
				.json();
		},
		update(
			agent: string,
			name: string,
			data: UpdateSkillRequest,
			scope: "global" | "project" = "global",
			projectRoot?: string,
		): Promise<SkillResponse> {
			return client
				.put(`agents/${agent}/skills/${name}`, {
					searchParams: {
						scope,
						...(projectRoot ? { project_root: projectRoot } : {}),
					},
					json: data,
				})
				.json();
		},
		delete(
			agent: string,
			name: string,
			scope: "global" | "project" = "global",
			projectRoot?: string,
		): Promise<void> {
			return client
				.delete(`agents/${agent}/skills/${name}`, {
					searchParams: {
						scope,
						...(projectRoot ? { project_root: projectRoot } : {}),
					},
				})
				.then(() => undefined);
		},
	},
		mcps: {
			listAll(
				scope: "global" | "project" | "all" = "global",
				projectRoot?: string,
			): Promise<McpResponse[]> {
				return client
					.get("agents/all/mcps", {
						searchParams: {
							scope,
							...(projectRoot
								? { project_root: projectRoot }
								: {}),
						},
					})
					.json();
			},
			get(
				name: string,
				agent: string,
				scope: "global" | "project" | "all",
			): Promise<McpResponse> {
				return client
					.get(`agents/${agent}/mcps/${name}`, {
						searchParams: { scope },
					})
					.json();
			},
			create(
				agent: string,
				scope: "global" | "project",
				body: {
					name: string;
					transport: TransportDto;
					timeout?: number;
				},
				projectRoot?: string,
			): Promise<McpResponse> {
				return client
					.post(`agents/${agent}/mcps`, {
						searchParams: {
							scope,
							...(projectRoot
								? { project_root: projectRoot }
								: {}),
						},
						json: body,
					})
					.json();
			},
			update(
				name: string,
				agent: string,
				scope: "global" | "project",
				body: UpdateMcpRequest,
				projectRoot?: string,
			): Promise<McpResponse> {
				return client
					.put(`agents/${agent}/mcps/${name}`, {
						searchParams: {
							scope,
							...(projectRoot
								? { project_root: projectRoot }
								: {}),
						},
						json: body,
					})
					.json();
			},
			delete(
				name: string,
				agent: string,
				scope: "global" | "project",
				projectRoot?: string,
			): Promise<void> {
				return client
					.delete(`agents/${agent}/mcps/${name}`, {
						searchParams: {
							scope,
							...(projectRoot
								? { project_root: projectRoot }
								: {}),
						},
					})
					.then(() => undefined);
			},
		},
		market: {
			search(q: string, limit?: number): Promise<MarketSkill[]> {
				const searchParams: Record<string, string> = { q };
				if (limit) searchParams.limit = String(limit);
				return client
					.get("skills-market/search", { searchParams })
					.json();
			},
		},
		integrations: {
			listCodeEditors(): Promise<ToolInfo[]> {
				return client.get("integrations/code-editors").json();
			},
			listTerminals(): Promise<ToolInfo[]> {
				return client.get("integrations/terminals").json();
			},
			openWithEditor(
				path: string,
				editor: CodeEditorType,
				terminal?: TerminalType,
			): Promise<void> {
				return client
					.post("integrations/open-with-editor", {
						json: { path, editor, terminal },
					})
					.then(() => undefined);
			},
			openInTerminal(path: string, terminal: TerminalType): Promise<void> {
				return client
					.post("integrations/open-in-terminal", {
						json: { path, terminal },
					})
					.then(() => undefined);
			},
		},
	};
}

export type Api = ReturnType<typeof createApi>;
