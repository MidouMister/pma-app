"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { getTaskComments } from "@/lib/queries"

export async function getTaskDetailsData(taskId: string, projectId: string) {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { companyId: true }
  })

  if (!user?.companyId) {
    throw new Error("User unauthorized")
  }

  // 0. Fetch the Task to get unitId and current Tags
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { Tags: true }
  })

  if (!task || task.companyId !== user.companyId) {
    throw new Error("Task not found or unauthorized")
  }

  // 1. Fetch Comments
  const comments = await getTaskComments(taskId)

  // 2. Fetch Team Members (for Assignment dropdown)
  const teamMembers = await prisma.teamMember.findMany({
    where: { 
      team: { projectId },
      user: { companyId: user.companyId }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          email: true
        }
      }
    }
  })

  // 3. Fetch Time Entries specifically for this task
  const timeEntries = await prisma.timeEntry.findMany({
    where: { 
      taskId,
      companyId: user.companyId
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      }
    },
    orderBy: { startTime: 'desc' }
  })

  // 4. Fetch all available tags in the unit
  const unitTags = await prisma.tag.findMany({
    where: { unitId: task.unitId },
    orderBy: { name: 'asc' }
  })

  // 5. Fetch current task's tag IDs
  const taskTagIds = task.Tags.map((tag: { id: string }) => tag.id)

  return {
    comments,
    teamMembers,
    timeEntries,
    unitTags,
    taskTagIds
  }
}
