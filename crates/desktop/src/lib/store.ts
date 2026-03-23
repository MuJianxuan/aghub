import { Store } from "@tauri-apps/plugin-store";

const CURRENT_VERSION = 2;

export interface Project {
	id: string;
	name: string;
	path: string;
}

let store: Store | null = null;

async function getStore(): Promise<Store> {
	if (!store) {
		store = await Store.load("store.json");
	}
	return store;
}

async function migrate(store: Store): Promise<void> {
	const version = (await store.get<number>("version")) ?? 0;

	if (version === CURRENT_VERSION) return;

	// Migration v0 -> v1: initial schema
	if (version < 1) {
		await store.set("projects", []);
	}

	// Migration v1 -> v2: add disabledAgents
	if (version < 2) {
		await store.set("disabledAgents", []);
	}

	await store.set("version", CURRENT_VERSION);
	await store.save();
}

export async function initStore(): Promise<void> {
	const store = await getStore();
	await migrate(store);
}

export async function getProjects(): Promise<Project[]> {
	const store = await getStore();
	return (await store.get<Project[]>("projects")) ?? [];
}

export async function addProject(
	project: Omit<Project, "id">,
): Promise<Project> {
	const store = await getStore();
	const projects = await getProjects();
	const newProject: Project = {
		...project,
		id: crypto.randomUUID(),
	};
	await store.set("projects", [...projects, newProject]);
	await store.save();
	return newProject;
}

export async function removeProject(id: string): Promise<void> {
	const store = await getStore();
	const projects = await getProjects();
	await store.set(
		"projects",
		projects.filter((p) => p.id !== id),
	);
	await store.save();
}

export async function updateProject(
	id: string,
	updates: Partial<Omit<Project, "id">>,
): Promise<void> {
	const store = await getStore();
	const projects = await getProjects();
	await store.set(
		"projects",
		projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
	);
	await store.save();
}

// Disabled agents management
export async function getDisabledAgents(): Promise<string[]> {
	const store = await getStore();
	return (await store.get<string[]>("disabledAgents")) ?? [];
}

export async function setDisabledAgents(agentIds: string[]): Promise<void> {
	const store = await getStore();
	await store.set("disabledAgents", agentIds);
	await store.save();
}

export async function disableAgent(agentId: string): Promise<void> {
	const disabled = await getDisabledAgents();
	if (!disabled.includes(agentId)) {
		await setDisabledAgents([...disabled, agentId]);
	}
}

export async function enableAgent(agentId: string): Promise<void> {
	const disabled = await getDisabledAgents();
	await setDisabledAgents(disabled.filter((id) => id !== agentId));
}
