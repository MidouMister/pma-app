export interface TeamMember {
  user: {
    id: string
    name: string | null
    avatarUrl: string | null
  }
}

export interface TaskComment {
  id: string
  body: string
  createdAt: Date
  Author: {
    name: string | null
    avatarUrl: string | null
  }
}

export interface TimeEntry {
  id: string
  duration: number
  description: string | null
  startTime: Date
  user: {
    name: string | null
    avatarUrl: string | null
  }
}

export interface TaskTag {
  id: string
  name: string
  color: string
}

export interface TaskDetailData {
  teamMembers: TeamMember[]
  comments: TaskComment[]
  timeEntries: TimeEntry[]
  unitTags: TaskTag[]
  taskTagIds: string[]
}

export interface CurrentUser {
  name: string | null
  avatarUrl: string | null
}
