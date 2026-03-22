import { useState } from "react"
import { Plus, Bot, Search } from "lucide-react"
import { Button, Chip, TextField, InputGroup } from "@heroui/react"
import { cn } from "../../lib/utils"

interface Skill {
  id: string
  name: string
  description: string
  type: "user" | "system"
  usage: string
}

const skills: Skill[] = [
  { id: "agent-browser", name: "agent-browser", description: "Automates browser interactions for web testing, form filling, screenshots, and data extraction", type: "user", usage: "@agent-browser" },
  { id: "agent-reach", name: "agent-reach", description: "Give your AI agent eyes to see the entire internet across 16 platforms", type: "user", usage: "@agent-reach" },
  { id: "codebase-doc-gen", name: "codebase-doc-gen", description: "Analyze a codebase and generate structured architecture documentation", type: "user", usage: "@codebase-doc-gen" },
  { id: "deck-out-new-project", name: "deck-out-new-project", description: "Marketing-style README creation and GitHub repository configuration", type: "user", usage: "@deck-out-new-project" },
  { id: "find-skills", name: "find-skills", description: "Helps users discover and install agent skills", type: "user", usage: "@find-skills" },
  { id: "frontend-design", name: "frontend-design", description: "Create distinctive, production-grade frontend interfaces", type: "user", usage: "@frontend-design" },
  { id: "git-commit", name: "git-commit", description: "Execute git commit with conventional commit message analysis", type: "user", usage: "@git-commit" },
  { id: "pure-frontend-content-site", name: "pure-frontend-content-site", description: "纯前端内容型展示网站构建指南", type: "user", usage: "@pure-frontend-content-site" },
  { id: "react-doctor", name: "react-doctor", description: "Diagnose and fix React codebase health issues", type: "user", usage: "@react-doctor" },
  { id: "seo-audit", name: "seo-audit", description: "Audit, review, or diagnose SEO issues on your site", type: "user", usage: "@seo-audit" },
  { id: "skill-creator", name: "skill-creator", description: "Guide for creating effective skills", type: "user", usage: "@skill-creator" },
  { id: "vercel-composition-patterns", name: "vercel-composition-patterns", description: "React composition patterns that scale", type: "user", usage: "@vercel-composition-patterns" },
  { id: "vercel-react-best-practices", name: "vercel-react-best-practices", description: "React and Next.js performance optimization guidelines", type: "user", usage: "@vercel-react-best-practices" },
  { id: "vercel-react-native-skills", name: "vercel-react-native-skills", description: "React Native and Expo best practices for building performant mobile apps", type: "user", usage: "@vercel-react-native-skills" },
  { id: "web-design-guidelines", name: "web-design-guidelines", description: "Review UI code for Web Interface Guidelines compliance", type: "user", usage: "@web-design-guidelines" },
  { id: "web-search", name: "web-search", description: "Web search and content extraction with Tavily and Exa", type: "user", usage: "@web-search" },
]

export default function SkillsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(skills[0])

  const filteredSkills = skills.filter(
    (skill) =>
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-full">
      {/* Skills List Panel */}
      <div className="w-80 shrink-0 border-r border-[--border] flex flex-col">
        {/* Search Header */}
        <div className="flex items-center gap-2 p-3 border-b border-[--border]">
          <TextField
            value={searchQuery}
            onChange={setSearchQuery}
            aria-label="Search skills"
            fullWidth
          >
            <InputGroup variant="secondary">
              <InputGroup.Prefix>
                <Search className="size-4 text-[--muted]" />
              </InputGroup.Prefix>
              <InputGroup.Input placeholder="Search skills & command..." />
            </InputGroup>
          </TextField>
          <Button isIconOnly variant="ghost" size="sm">
            <Plus className="size-4" />
          </Button>
        </div>

        {/* Skills List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="px-2 py-1.5 text-xs font-medium text-[--muted] uppercase tracking-wide">
              USER
            </div>
            {filteredSkills.map((skill) => (
              <button
                key={skill.id}
                onClick={() => setSelectedSkill(skill)}
                className={cn(
                  "w-full flex items-start gap-2 rounded-md px-2 py-2 text-left transition-colors",
                  selectedSkill?.id === skill.id
                    ? "bg-[--surface-secondary]"
                    : "hover:bg-[--surface-tertiary]"
                )}
              >
                <div className="size-2 mt-1.5 rounded-full bg-[--accent]" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate text-[--foreground]">{skill.name}</div>
                  <div className="text-xs text-[--muted] truncate">
                    {skill.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Skill Detail Panel */}
      <div className="flex-1 overflow-hidden">
        {selectedSkill ? (
          <div className="h-full overflow-y-auto">
            <div className="p-6 max-w-3xl">
              {/* Header */}
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-semibold text-[--foreground]">{selectedSkill.name}</h1>
                <Chip variant="soft" size="sm">Skill</Chip>
              </div>
              <p className="text-sm text-[--muted] mb-6">
                ~/.claude/skills/{selectedSkill.name}/SKILL.md
              </p>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-sm font-medium text-[--muted] mb-2">Description</h2>
                <div className="rounded-lg border border-[--border] bg-[--surface-secondary] p-3">
                  <p className="text-sm text-[--foreground]">{selectedSkill.description}</p>
                </div>
              </div>

              {/* Usage */}
              <div className="mb-6">
                <h2 className="text-sm font-medium text-[--muted] mb-2">Usage</h2>
                <div className="rounded-lg border border-[--border] bg-[--surface-secondary] p-3">
                  <code className="text-sm font-mono text-[--foreground]">{selectedSkill.usage}</code>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-medium text-[--muted]">Instructions</h2>
                  <Bot className="size-4 text-[--muted]" />
                </div>
                <div className="rounded-lg border border-[--border] bg-[--surface-secondary] p-4">
                  <h3 className="text-base font-semibold text-[--foreground] mb-3">
                    Browser Automation with agent-browser
                  </h3>
                  <h4 className="text-sm font-medium text-[--foreground] mb-2">Quick start</h4>
                  <pre className="bg-[--surface-tertiary] rounded-md p-3 text-xs font-mono overflow-x-auto text-[--foreground]">
                    <code>{`agent-browser open <url>        # Navigate to page
agent-browser snapshot -i       # Get interactive elements with refs
agent-browser click @e1         # Click element by ref
agent-browser fill @e2 "text"   # Fill input by ref
agent-browser close             # Close browser`}</code>
                  </pre>

                  <h4 className="text-sm font-medium text-[--foreground] mt-4 mb-2">Core workflow</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-[--foreground]">
                    <li>
                      Navigate: <code className="bg-[--surface-tertiary] px-1 py-0.5 rounded text-xs">agent-browser open {"<url>"}</code>
                    </li>
                    <li>
                      Snapshot: <code className="bg-[--surface-tertiary] px-1 py-0.5 rounded text-xs">agent-browser snapshot -i</code>{" "}
                      (returns refs like <code className="bg-[--surface-tertiary] px-1 py-0.5 rounded text-xs">@e1</code>)
                    </li>
                    <li>Interact using refs from the snapshot</li>
                    <li>Re-snapshot after navigation or significant DOM changes</li>
                  </ol>

                  <h4 className="text-sm font-medium text-[--foreground] mt-4 mb-2">Navigation commands</h4>
                  <pre className="bg-[--surface-tertiary] rounded-md p-3 text-xs font-mono overflow-x-auto text-[--foreground]">
                    <code>{`agent-browser open <url>   # Navigate (aliases: goto, navigate)
agent-browser back         # Go back
agent-browser forward      # Go forward
agent-browser reload       # Reload page
agent-browser close        # Close browser (aliases: quit, exit)`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-[--muted]">
            Select a skill to view details
          </div>
        )}
      </div>
    </div>
  )
}
