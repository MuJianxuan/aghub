export enum ConfigSource {
	Global = "global",
	Project = "project",
}

export interface SkillResponse {
	name: string;
	enabled: boolean;
	source_path?: string;
	description?: string;
	author?: string;
	version?: string;
	tools: string[];
	source?: ConfigSource;
	agent?: string;
}

export type TransportDto =
	| {
			type: "stdio";
			command: string;
			args?: string[];
			env?: Record<string, string>;
			timeout?: number;
	  }
	| {
			type: "sse";
			url: string;
			headers?: Record<string, string>;
			timeout?: number;
	  }
	| {
			type: "streamable_http";
			url: string;
			headers?: Record<string, string>;
			timeout?: number;
	  };

export interface McpResponse {
	name: string;
	enabled: boolean;
	transport: TransportDto;
	timeout?: number;
	source?: ConfigSource;
	agent?: string;
}

export interface CreateSkillRequest {
	name: string;
	description?: string;
	author?: string;
	version?: string;
	tools?: string[];
}

export interface MarketSkill {
	name: string;
	slug: string;
	source: string;
	installs: number;
	author?: string;
}

export interface InstallSkillRequest {
	source: string;
	agents: string[];
	scope: "global" | "project";
	project_path?: string;
}

export interface InstallSkillResponse {
	success: boolean;
	stdout: string;
	stderr: string;
	exit_code: number;
}

export type CodeEditorType =
	| "vscode"
	| "antigravity"
	| "cursor"
	| "zed"
	| "vim";

export type TerminalType =
	| "alacritty"
	| "ghostty"
	| "iterm"
	| "apple_terminal";

export type ToolType = "code_editor" | "terminal";

export interface ToolInfo {
	id: string;
	name: string;
	installed: boolean;
	path?: string;
	tool_type: ToolType;
}

export interface ToolPreferences {
	code_editor?: CodeEditorType;
	terminal?: TerminalType;
}
