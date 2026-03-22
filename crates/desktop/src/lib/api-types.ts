export interface SkillResponse {
  name: string
  enabled: boolean
  source_path?: string
  description?: string
  author?: string
  version?: string
  tools: string[]
  source?: "Global" | "Project"
  agent?: string
}
