import { useMemo, useState } from "react"
import { PlusIcon } from "@heroicons/react/24/solid"
import { Button, Chip, Description, Header, Label, ListBox, SearchField, type Selection } from "@heroui/react"
import { useSkills } from "../../hooks/use-skills"
import type { SkillResponse } from "../../lib/api-types"

export default function SkillsPage() {
  const { data: skills } = useSkills()
  const [searchQuery, setSearchQuery] = useState("")
  const [selected, setSelected] = useState<Selection>(
    new Set(skills[0] ? [`${skills[0].agent || ""}/${skills[0].name}`] : [])
  )

  const selectedSkill = skills.find(
    (s) => [...(selected as Set<string>)][0] === `${s.agent || ""}/${s.name}`
  ) ?? null

  const filteredSkills = useMemo(
    () =>
      skills.filter(
        (skill) =>
          skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (skill.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [skills, searchQuery]
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
              <SearchField.Input placeholder="Search skills..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <Button isIconOnly variant="ghost" size="sm" aria-label="Add skill">
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
              ALL SKILLS ({filteredSkills.length})
            </Header>
            {filteredSkills.map((skill) => (
              <ListBox.Item
                key={`${skill.agent || ""}/${skill.name}`}
                id={`${skill.agent || ""}/${skill.name}`}
                textValue={skill.name}
              >
                <div className="flex-1 min-w-0 overflow-hidden">
                  <Label className="truncate">{skill.name}</Label>
                  <Description className="truncate">
                    {skill.description ?? "No description"}
                  </Description>
                </div>
                {skill.agent && (
                  <Chip
                    size="sm"
                    className="max-w-20 truncate"
                  >
                    {skill.agent}
                  </Chip>
                )}
              </ListBox.Item>
            ))}
          </ListBox.Section>
        </ListBox>
        {filteredSkills.length === 0 && (
          <p className="px-3 py-6 text-sm text-muted text-center">
            No skills match &ldquo;{searchQuery}&rdquo;
          </p>
        )}
      </div>

      {/* Skill Detail Panel */}
      <div className="flex-1 overflow-hidden">
        {selectedSkill ? (
          <SkillDetail skill={selectedSkill} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted">Select a skill to view details</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SkillDetail({ skill }: { skill: SkillResponse }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-semibold leading-tight text-foreground">{skill.name}</h2>
          {skill.agent && (
            <Chip size="sm">
              {skill.agent}
            </Chip>
          )}
        </div>
        {skill.source_path && (
          <p className="text-xs text-muted mb-6 font-mono">{skill.source_path}</p>
        )}

        {/* Description */}
        {skill.description && (
          <div className="mb-6">
            <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Description</h3>
            <p className="text-sm text-foreground">{skill.description}</p>
          </div>
        )}

        {/* Metadata */}
        {(skill.author || skill.version) && (
          <div className="mb-6 flex gap-6">
            {skill.author && (
              <div>
                <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-1">Author</h3>
                <p className="text-sm text-foreground">{skill.author}</p>
              </div>
            )}
            {skill.version && (
              <div>
                <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-1">Version</h3>
                <p className="text-sm text-foreground font-mono">{skill.version}</p>
              </div>
            )}
          </div>
        )}

        {/* Tools */}
        {skill.tools.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
              Tools ({skill.tools.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {skill.tools.map((tool) => (
                <Chip key={tool} size="sm">
                  {tool}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* Source scope */}
        {skill.source && (
          <div>
            <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-1">Source</h3>
            <Chip size="sm">
              {skill.source}
            </Chip>
          </div>
        )}
      </div>
    </div>
  )
}
