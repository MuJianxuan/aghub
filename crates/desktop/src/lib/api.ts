import type { McpResponse, SkillResponse } from "./api-types"

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new ApiError(res.status, body || res.statusText)
  }
  return res.json()
}

export function createApi(baseUrl: string) {
  return {
    skills: {
      listAll(scope: "global" | "project" | "all" = "global"): Promise<SkillResponse[]> {
        return fetchJson(`${baseUrl}/agents/all/skills?scope=${scope}`)
      },
    },
    mcps: {
      listAll(scope: "global" | "project" | "all" = "global"): Promise<McpResponse[]> {
        return fetchJson(`${baseUrl}/agents/all/mcps?scope=${scope}`)
      },
    },
  }
}

export type Api = ReturnType<typeof createApi>
