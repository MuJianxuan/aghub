import React from "react"
import { Link, useLocation } from "wouter"
import { Separator } from "@heroui/react"
import {
  ChevronLeftIcon,
  AdjustmentsHorizontalIcon,
  UserIcon,
  SwatchIcon,
  CommandLineIcon,
  BeakerIcon,
  FolderOpenIcon,
  ArchiveBoxIcon,
  BookOpenIcon,
  CpuChipIcon,
  ServerIcon,
  PuzzlePieceIcon,
} from "@heroicons/react/24/solid"
import { cn } from "../lib/utils"

type MenuItem =
  | { type: "divider" }
  | { type: "link"; label: string; href: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; isBack?: boolean }

const menuItems: MenuItem[] = [
  { type: "link", label: "Back", href: "/", icon: ChevronLeftIcon, isBack: true },
  { type: "divider" },
  { type: "link", label: "Preferences", href: "/settings/preferences", icon: AdjustmentsHorizontalIcon },
  { type: "link", label: "Account", href: "/settings/account", icon: UserIcon },
  { type: "link", label: "Appearance", href: "/settings/appearance", icon: SwatchIcon },
  { type: "link", label: "Keyboard", href: "/settings/keyboard", icon: CommandLineIcon },
  { type: "link", label: "Beta", href: "/settings/beta", icon: BeakerIcon },
  { type: "divider" },
  { type: "link", label: "Projects", href: "/settings/projects", icon: FolderOpenIcon },
  { type: "link", label: "Models", href: "/settings/models", icon: ArchiveBoxIcon },
  { type: "link", label: "Skills", href: "/settings/skills", icon: BookOpenIcon },
  { type: "link", label: "Custom Agents", href: "/settings/custom-agents", icon: CpuChipIcon },
  { type: "link", label: "MCP Servers", href: "/settings/mcp-servers", icon: ServerIcon },
  { type: "link", label: "Plugins", href: "/settings/plugins", icon: PuzzlePieceIcon },
]

export function SettingsSidebar() {
  const [pathname] = useLocation()

  return (
    <aside className="w-60 shrink-0 border-r border-[--border] bg-[--surface] p-3">
      <nav className="flex flex-col gap-0.5">
        {menuItems.map((item, index) => {
          if (item.type === "divider") {
            return <Separator key={index} className="my-2" />
          }

          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-[--accent]/10 text-[--foreground] font-medium"
                  : "text-[--muted] hover:bg-[--surface-secondary] hover:text-[--foreground]",
                item.isBack && "text-[--foreground]"
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
