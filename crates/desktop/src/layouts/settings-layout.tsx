import { SettingsSidebar } from '../components/settings-sidebar'

export function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[--background]">
      <SettingsSidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
