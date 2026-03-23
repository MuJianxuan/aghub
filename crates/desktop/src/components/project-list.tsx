import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, Link } from "wouter";
import { Dropdown, Label } from "@heroui/react";
import {
  FolderIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import { useProjects, useRemoveProject } from "../hooks/use-projects";
import { EditProjectDialog, CreateProjectDialog } from "./edit-project-dialog";
import type { Project } from "../lib/store";
import { cn } from "../lib/utils";

interface ProjectListItemProps {
  project: Project;
  isActive: boolean;
  onEdit: (project: Project) => void;
}

function ProjectListItem({ project, isActive, onEdit }: ProjectListItemProps) {
  const { t } = useTranslation();
  const removeProject = useRemoveProject();
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (key: React.Key) => {
    const keyStr = String(key);
    if (keyStr === "edit") {
      onEdit(project);
    } else if (keyStr === "delete") {
      removeProject.mutate(project.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(true);
  };

  return (
    <Dropdown isOpen={isOpen} onOpenChange={setIsOpen}>
      <Link
        href={`/projects/${project.id}`}
        onContextMenu={handleContextMenu}
        className={cn(
          "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors cursor-pointer select-none",
          isActive
            ? "bg-accent/10 text-foreground font-medium"
            : "text-muted hover:bg-surface-secondary hover:text-foreground",
        )}
      >
        <FolderIcon className="size-4 shrink-0" />
        <span className="truncate">{project.name}</span>
      </Link>
      <Dropdown.Popover placement="bottom start">
        <Dropdown.Menu onAction={handleAction}>
          <Dropdown.Item id="edit" textValue={t("edit")}>
            <Label>{t("edit")}</Label>
          </Dropdown.Item>
          <Dropdown.Item id="delete" textValue={t("remove")} variant="danger">
            <Label>{t("remove")}</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export function ProjectList() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { data: projects = [] } = useProjects();
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsEditDialogOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditDialogOpen(false);
    setEditingProject(null);
  };

  const ChevronIcon = isExpanded ? ChevronUpIcon : ChevronDownIcon;

  return (
    <>
      {/* Projects Header */}
      <div className="mt-4">
        <div className="flex items-center justify-between px-3 py-2">
          <button
            className="flex items-center gap-2 flex-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <h3 className="text-xs font-medium text-muted uppercase tracking-wide">
              {t("projects")}
            </h3>
            <ChevronIcon className="size-3 text-muted" />
          </button>
          <button
            className="h-5 w-5 min-w-0 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-surface-secondary"
            aria-label={t("addProject")}
            onClick={(e) => {
              e.stopPropagation();
              setIsCreateDialogOpen(true);
            }}
          >
            <PlusIcon className="size-3" />
          </button>
        </div>

        {/* Projects List */}
        {isExpanded && (
          <div className="flex flex-col gap-0.5">
            {projects.map((project) => (
              <ProjectListItem
                key={project.id}
                project={project}
                isActive={location === `/projects/${project.id}`}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {editingProject && (
        <EditProjectDialog
          project={editingProject}
          isOpen={isEditDialogOpen}
          onClose={handleCloseEdit}
        />
      )}

      {/* Create Dialog */}
      <CreateProjectDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </>
  );
}
