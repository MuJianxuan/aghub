import { useParams } from "wouter"
import { useProjects } from "../../hooks/use-projects"

export default function ProjectDetailPage() {
  const { id } = useParams()
  const { data: projects = [] } = useProjects()
  const project = projects.find((p) => p.id === id)

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted">Project not found</p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-sm text-muted">{project.name}</p>
    </div>
  )
}
