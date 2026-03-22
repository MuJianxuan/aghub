import { useState } from "react"
import { PlusIcon, ArrowPathIcon, TrashIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid"
import { Button, TextField, InputGroup } from "@heroui/react"
import { cn } from "../../lib/utils"

interface MCPServer {
  id: string
  name: string
  source: string
  tools: number
  status: "online" | "offline"
  category: string
  connection?: { type: string; command: string; args: string }
  toolsList?: { name: string; description: string }[]
}

const mcpServers: MCPServer[] = [
  {
    id: "context7-claude",
    name: "context7",
    source: "Global",
    tools: 2,
    status: "online",
    category: "CLAUDE CODE",
    connection: { type: "stdio", command: "npx", args: "-y @upstash/context7-mcp" },
    toolsList: [
      { name: "resolve-library-id", description: "Resolves a package/product name to a Context7-compatible library ID and returns matching libraries." },
      { name: "query-docs", description: "Retrieves and queries up-to-date documentation and code examples from Context7 for any programming library or framework." },
    ],
  },
  { id: "context7-poly", name: "context7", source: "poly-market", tools: 2, status: "online", category: "CLAUDE CODE" },
  { id: "shadcn", name: "shadcn", source: "poly-market", tools: 7, status: "online", category: "CLAUDE CODE" },
  { id: "better-auth", name: "better-auth", source: "poly-market", tools: 4, status: "online", category: "CLAUDE CODE" },
  { id: "context7-codex", name: "context7", source: "Global", tools: 2, status: "online", category: "CODEX" },
  { id: "pencil", name: "pencil", source: "Global", tools: 14, status: "online", category: "CODEX" },
]

export default function MCPServersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(mcpServers[0])

  const filteredServers = mcpServers.filter(
    (server) =>
      server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.source.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedServers = filteredServers.reduce((acc, server) => {
    if (!acc[server.category]) acc[server.category] = []
    acc[server.category].push(server)
    return acc
  }, {} as Record<string, MCPServer[]>)

  return (
    <div className="flex h-full">
      {/* Servers List Panel */}
      <div className="w-80 shrink-0 border-r border-[--border] flex flex-col">
        {/* Search Header */}
        <div className="flex items-center gap-2 p-3 border-b border-[--border]">
          <TextField
            value={searchQuery}
            onChange={setSearchQuery}
            aria-label="Search MCP servers"
            fullWidth
          >
            <InputGroup variant="secondary">
              <InputGroup.Prefix>
                <MagnifyingGlassIcon className="size-4 text-[--muted]" />
              </InputGroup.Prefix>
              <InputGroup.Input placeholder="Search servers..." />
            </InputGroup>
          </TextField>
          <Button isIconOnly variant="ghost" size="sm">
            <PlusIcon className="size-4" />
          </Button>
          <Button isIconOnly variant="ghost" size="sm">
            <ArrowPathIcon className="size-4" />
          </Button>
        </div>

        {/* Servers List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {Object.entries(groupedServers).map(([category, servers]) => (
              <div key={category} className="mb-4">
                <div className="px-2 py-1.5 text-xs font-medium text-[--muted] uppercase tracking-wide">
                  {category}
                </div>
                {servers.map((server) => (
                  <button
                    key={server.id}
                    onClick={() => setSelectedServer(server)}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-md px-2 py-2 text-left transition-colors",
                      selectedServer?.id === server.id
                        ? "bg-[--surface-secondary]"
                        : "hover:bg-[--surface-tertiary]"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[--foreground]">{server.name}</div>
                      <div className="text-xs text-[--muted]">{server.source}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          server.status === "online" ? "bg-[--success]" : "bg-[--muted]"
                        )}
                      />
                      <span className="text-xs text-[--muted]">{server.tools} tools</span>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Server Detail Panel */}
      <div className="flex-1 overflow-hidden">
        {selectedServer ? (
          <div className="h-full overflow-y-auto">
            <div className="p-6 max-w-3xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-xl font-semibold text-[--foreground]">{selectedServer.name}</h1>
                <Button isIconOnly variant="ghost" size="sm" className="text-[--muted] hover:text-[--danger]">
                  <TrashIcon className="size-4" />
                </Button>
              </div>
              <p className="text-sm text-[--muted] mb-6">{selectedServer.tools} tools</p>

              {/* Connection */}
              {selectedServer.connection && (
                <div className="mb-6">
                  <h2 className="text-sm font-medium text-[--foreground] mb-3">Connection</h2>
                  <div className="rounded-lg border border-[--border] overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b border-[--border]">
                          <td className="px-4 py-2.5 text-[--muted] bg-[--surface-secondary] w-24">Type</td>
                          <td className="px-4 py-2.5 font-medium text-[--foreground]">{selectedServer.connection.type}</td>
                        </tr>
                        <tr className="border-b border-[--border]">
                          <td className="px-4 py-2.5 text-[--muted] bg-[--surface-secondary]">Command</td>
                          <td className="px-4 py-2.5 font-medium text-[--foreground]">{selectedServer.connection.command}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5 text-[--muted] bg-[--surface-secondary] align-top">Args</td>
                          <td className="px-4 py-2.5 font-mono text-xs break-all text-[--foreground]">{selectedServer.connection.args}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tools */}
              {selectedServer.toolsList && selectedServer.toolsList.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-[--foreground] mb-3">
                    Tools ({selectedServer.toolsList.length})
                  </h2>
                  <div className="space-y-3">
                    {selectedServer.toolsList.map((tool) => (
                      <div key={tool.name} className="rounded-lg border border-[--border] p-4">
                        <h3 className="font-mono text-sm font-semibold mb-2 text-[--foreground]">{tool.name}</h3>
                        <p className="text-sm text-[--muted] leading-relaxed">{tool.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-[--muted]">
            Select a server to view details
          </div>
        )}
      </div>
    </div>
  )
}
