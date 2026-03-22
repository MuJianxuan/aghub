import { useState } from "react"
import { PlusIcon, CpuChipIcon } from "@heroicons/react/24/solid"
import { Button, Card, Chip, Description, Header, Label, ListBox, SearchField, type Selection } from "@heroui/react"

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
  const [selected, setSelected] = useState<Selection>(new Set([skills[0].id]))

  const selectedSkill = skills.find(s => [...(selected as Set<string>)][0] === s.id) ?? null

  const filteredSkills = skills.filter(
    (skill) =>
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-full">
      {/* Skills List Panel */}
      <div className="w-80 shrink-0 border-r border-border flex flex-col">
        {/* Search Header */}
        <div className="flex items-center gap-2 p-3 border-b border-border">
          <SearchField
            value={searchQuery}
            onChange={setSearchQuery}
            aria-label="Search skills"
            variant="secondary"
            className="flex-1"
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search skills & command..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <Button isIconOnly variant="ghost" size="sm">
            <PlusIcon className="size-4" />
          </Button>
        </div>

        {/* Skills List */}
        <ListBox
          aria-label="Skills"
          selectionMode="single"
          selectedKeys={selected}
          onSelectionChange={setSelected}
          className="flex-1 overflow-y-auto p-2"
        >
          <ListBox.Section>
            <Header className="px-2 py-1.5 text-xs font-medium text-muted uppercase tracking-wide">
              USER
            </Header>
            {filteredSkills.map((skill) => (
              <ListBox.Item key={skill.id} id={skill.id} textValue={skill.name}>
                <div className="size-2 rounded-full bg-accent shrink-0 mt-1" />
                <div className="flex flex-col min-w-0">
                  <Label className="truncate">{skill.name}</Label>
                  <Description className="truncate">{skill.description}</Description>
                </div>
              </ListBox.Item>
            ))}
          </ListBox.Section>
        </ListBox>
      </div>

      {/* Skill Detail Panel */}
      <div className="flex-1 overflow-hidden">
        {selectedSkill ? (
          <div className="h-full overflow-y-auto">
            <div className="p-6 max-w-3xl">
              {/* Header */}
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-semibold text-foreground">{selectedSkill.name}</h1>
                <Chip variant="soft" size="sm">Skill</Chip>
              </div>
              <p className="text-sm text-muted mb-6">
                ~/.claude/skills/{selectedSkill.name}/SKILL.md
              </p>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-sm font-medium text-muted mb-2">Description</h2>
                <Card variant="secondary">
                  <Card.Content>
                    <p className="text-sm">{selectedSkill.description}</p>
                  </Card.Content>
                </Card>
              </div>

              {/* Usage */}
              <div className="mb-6">
                <h2 className="text-sm font-medium text-muted mb-2">Usage</h2>
                <Card variant="secondary">
                  <Card.Content>
                    <code className="text-sm font-mono">{selectedSkill.usage}</code>
                  </Card.Content>
                </Card>
              </div>

              {/* Instructions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-medium text-muted">Instructions</h2>
                  <CpuChipIcon className="size-4 text-muted" />
                </div>
                <Card variant="secondary">
                  <Card.Content>
                    <h3 className="text-base font-semibold mb-3">
                      Browser Automation with agent-browser
                    </h3>
                    <h4 className="text-sm font-medium mb-2">Quick start</h4>
                    <pre className="bg-surface-tertiary rounded-md p-3 text-xs font-mono overflow-x-auto">
                      <code>{`agent-browser open <url>        # Navigate to page
agent-browser snapshot -i       # Get interactive elements with refs
agent-browser click @e1         # Click element by ref
agent-browser fill @e2 "text"   # Fill input by ref
agent-browser close             # Close browser`}</code>
                    </pre>

                    <h4 className="text-sm font-medium mt-4 mb-2">Core workflow</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>
                        Navigate: <code className="bg-surface-tertiary px-1 py-0.5 rounded text-xs">agent-browser open {"<url>"}</code>
                      </li>
                      <li>
                        Snapshot: <code className="bg-surface-tertiary px-1 py-0.5 rounded text-xs">agent-browser snapshot -i</code>{" "}
                        (returns refs like <code className="bg-surface-tertiary px-1 py-0.5 rounded text-xs">@e1</code>)
                      </li>
                      <li>Interact using refs from the snapshot</li>
                      <li>Re-snapshot after navigation or significant DOM changes</li>
                    </ol>

                    <h4 className="text-sm font-medium mt-4 mb-2">Navigation commands</h4>
                    <pre className="bg-surface-tertiary rounded-md p-3 text-xs font-mono overflow-x-auto">
                      <code>{`agent-browser open <url>   # Navigate (aliases: goto, navigate)
agent-browser back         # Go back
agent-browser forward      # Go forward
agent-browser reload       # Reload page
agent-browser close        # Close browser (aliases: quit, exit)`}</code>
                    </pre>
                  </Card.Content>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted">
            Select a skill to view details
          </div>
        )}
      </div>
    </div>
  )
}
