import { Link } from "wouter"
import { Button } from "@heroui/react"
import { Settings, BookOpen, Bot, Server } from "lucide-react"

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[--background]">
      <div className="text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-[--foreground]">Settings Dashboard</h1>
          <p className="text-[--muted]">
            A clone of the Claude Desktop settings interface
          </p>
        </div>

        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <Link href="/settings/skills">
            <Button variant="outline" fullWidth className="justify-start gap-3 h-12">
              <BookOpen className="size-5" />
              <span>Skills</span>
            </Button>
          </Link>

          <Link href="/settings/custom-agents">
            <Button variant="outline" fullWidth className="justify-start gap-3 h-12">
              <Bot className="size-5" />
              <span>Custom Agents</span>
            </Button>
          </Link>

          <Link href="/settings/mcp-servers">
            <Button variant="outline" fullWidth className="justify-start gap-3 h-12">
              <Server className="size-5" />
              <span>MCP Servers</span>
            </Button>
          </Link>

          <Link href="/settings/skills">
            <Button variant="primary" fullWidth className="justify-start gap-3 h-12">
              <Settings className="size-5" />
              <span>Open Settings</span>
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
