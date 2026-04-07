import Link from "next/link"
import { Users, FolderKanban, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const UNIT_ACCENTS = [
  "border-l-primary",
  "border-l-emerald-500",
  "border-l-violet-500",
  "border-l-amber-500",
  "border-l-rose-500",
  "border-l-sky-500",
]

interface UnitCardData {
  id: string
  name: string
  adminName: string | null
  projectCount: number
  memberCount: number
  totalProjects: number
}

interface UnitCardProps {
  unit: UnitCardData
  index: number
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function UnitCard({ unit, index }: UnitCardProps) {
  const accent = UNIT_ACCENTS[index % UNIT_ACCENTS.length]
  const projectRatio =
    unit.totalProjects > 0
      ? Math.round((unit.projectCount / unit.totalProjects) * 100)
      : 0

  // Health: green if has active projects, amber if only completed, red if none
  const healthColor =
    unit.projectCount > 0 ? "bg-emerald-500" : "bg-muted-foreground/30"

  return (
    <Link
      href={`/unite/${unit.id}`}
      className={cn(
        "group/unit flex flex-col gap-4 rounded-xl border bg-card p-5 transition-all duration-200",
        "border-l-4",
        accent,
        "cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="size-9 border">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {getInitials(unit.name)}
              </AvatarFallback>
            </Avatar>
            {/* Health dot */}
            <span
              className={cn(
                "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-card",
                healthColor
              )}
            />
          </div>
          <div className="flex flex-col">
            <h3 className="font-medium text-foreground transition-colors group-hover/unit:text-primary">
              {unit.name}
            </h3>
            {unit.adminName ? (
              <p className="text-xs text-muted-foreground">
                Admin: {unit.adminName}
              </p>
            ) : (
              <Badge variant="outline" className="mt-0.5 w-fit text-[10px]">
                Aucun admin
              </Badge>
            )}
          </div>
        </div>
        <ArrowRight className="size-4 -translate-x-1 text-muted-foreground opacity-0 transition-all duration-200 group-hover/unit:translate-x-0 group-hover/unit:opacity-100" />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <FolderKanban className="size-3.5" />
          <span>
            {unit.projectCount} projet{unit.projectCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="size-3.5" />
          <span>
            {unit.memberCount} membre{unit.memberCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {unit.totalProjects > 0 && (
        <div className="flex items-center gap-2">
          <Progress value={projectRatio} className="h-1 flex-1" />
          <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
            {projectRatio}%
          </span>
        </div>
      )}
    </Link>
  )
}
