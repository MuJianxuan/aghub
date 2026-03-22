import { Surface } from '@heroui/react'
import { SettingsSidebar } from '../components/settings-sidebar'

export function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Surface variant="default" className="flex h-screen overflow-hidden">
      <SettingsSidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </Surface>
  )
}
