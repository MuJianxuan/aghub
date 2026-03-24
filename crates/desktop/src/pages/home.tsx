import {
	BookOpenIcon,
	Cog6ToothIcon,
	CpuChipIcon,
	ServerIcon,
} from "@heroicons/react/24/solid";
import { Button, Surface } from "@heroui/react";
import { Link } from "wouter";

export default function HomePage() {
	return (
		<Surface
			variant="default"
			className="flex min-h-screen items-center justify-center"
		>
			<div className="space-y-8 text-center">
				<div className="space-y-2">
					<h1 className="text-3xl font-semibold tracking-tight text-foreground">
						Settings Dashboard
					</h1>
					<p className="text-muted">
						A clone of the Claude Desktop settings interface
					</p>
				</div>

				<div className="mx-auto flex max-w-xs flex-col gap-3">
					<Link href="/settings/skills">
						<Button
							variant="outline"
							fullWidth
							className="h-12 justify-start gap-3"
						>
							<BookOpenIcon className="size-5" />
							<span>Skills</span>
						</Button>
					</Link>

					<Link href="/settings/custom-agents">
						<Button
							variant="outline"
							fullWidth
							className="h-12 justify-start gap-3"
						>
							<CpuChipIcon className="size-5" />
							<span>Custom Agents</span>
						</Button>
					</Link>

					<Link href="/settings/mcp-servers">
						<Button
							variant="outline"
							fullWidth
							className="h-12 justify-start gap-3"
						>
							<ServerIcon className="size-5" />
							<span>MCP Servers</span>
						</Button>
					</Link>

					<Link href="/settings/skills">
						<Button
							variant="primary"
							fullWidth
							className="h-12 justify-start gap-3"
						>
							<Cog6ToothIcon className="size-5" />
							<span>Open Settings</span>
						</Button>
					</Link>
				</div>
			</div>
		</Surface>
	);
}
