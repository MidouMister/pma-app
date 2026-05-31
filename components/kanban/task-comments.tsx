"use client"

import { type FC, useState, useRef, useCallback, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, Send } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

import { type KanbanTaskComment, type CurrentUser } from "@/lib/types"

interface MentionableUser {
  id: string
  name: string
  avatarUrl?: string | null
}

interface TaskCommentsProps {
  comments: KanbanTaskComment[] | undefined
  isLoading: boolean
  currentUser: CurrentUser | null
  newComment: string
  isPending: boolean
  onCommentChange: (value: string) => void
  onAddComment: () => void
  /** List of users that can be @mentioned */
  mentionableUsers?: MentionableUser[]
}

export const TaskComments: FC<TaskCommentsProps> = ({
  comments,
  isLoading,
  currentUser,
  newComment,
  isPending,
  onCommentChange,
  onAddComment,
  mentionableUsers = [],
}) => {
  const [showMentionMenu, setShowMentionMenu] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [mentionIndex, setMentionIndex] = useState(0)
  const [mentionStartPos, setMentionStartPos] = useState(-1)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const filteredMentions = mentionableUsers.filter((u) =>
    u.name?.toLowerCase().includes(mentionQuery.toLowerCase())
  )

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value
      const cursorPos = e.target.selectionStart ?? value.length
      onCommentChange(value)

      // Check if we're in a @mention context
      const textBeforeCursor = value.slice(0, cursorPos)
      const lastAtIndex = textBeforeCursor.lastIndexOf("@")

      if (
        lastAtIndex !== -1 &&
        (lastAtIndex === 0 || textBeforeCursor[lastAtIndex - 1] === " ")
      ) {
        const query = textBeforeCursor.slice(lastAtIndex + 1)
        // Only show if query doesn't contain spaces that would break the mention
        if (!query.includes("\n")) {
          setMentionQuery(query)
          setMentionStartPos(lastAtIndex)
          setShowMentionMenu(true)
          setMentionIndex(0)
          return
        }
      }
      setShowMentionMenu(false)
    },
    [onCommentChange]
  )

  const insertMention = useCallback(
    (user: MentionableUser) => {
      const before = newComment.slice(0, mentionStartPos)
      const after = newComment.slice(
        mentionStartPos + 1 + mentionQuery.length
      )
      const inserted = `${before}@${user.name} ${after}`
      onCommentChange(inserted)
      setShowMentionMenu(false)
      setMentionQuery("")
      setMentionStartPos(-1)
      // Focus back on textarea
      setTimeout(() => textareaRef.current?.focus(), 0)
    },
    [newComment, mentionStartPos, mentionQuery, onCommentChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (showMentionMenu && filteredMentions.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault()
          setMentionIndex((i) =>
            i < filteredMentions.length - 1 ? i + 1 : 0
          )
          return
        }
        if (e.key === "ArrowUp") {
          e.preventDefault()
          setMentionIndex((i) =>
            i > 0 ? i - 1 : filteredMentions.length - 1
          )
          return
        }
        if (e.key === "Enter" && !e.ctrlKey) {
          e.preventDefault()
          insertMention(filteredMentions[mentionIndex])
          return
        }
        if (e.key === "Escape") {
          e.preventDefault()
          setShowMentionMenu(false)
          return
        }
      }
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault()
        onAddComment()
      }
    },
    [
      showMentionMenu,
      filteredMentions,
      mentionIndex,
      insertMention,
      onAddComment,
    ]
  )

  // Close mention menu on blur with a delay so click events register
  useEffect(() => {
    if (!showMentionMenu) return
    const handleClickOutside = () => setShowMentionMenu(false)
    const timer = setTimeout(
      () => document.addEventListener("click", handleClickOutside),
      100
    )
    return () => {
      clearTimeout(timer)
      document.removeEventListener("click", handleClickOutside)
    }
  }, [showMentionMenu])

  return (
    <div className="mt-0 space-y-8 pb-10">
      {/* Comment Input */}
      <div className="flex items-start gap-4">
        <Avatar className="h-9 w-9 shrink-0 border shadow-sm">
          <AvatarImage src={currentUser?.avatarUrl || undefined} />
          <AvatarFallback className="bg-muted font-bold text-muted-foreground">
            {currentUser?.name?.[0]?.toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder="Écrivez un commentaire... Tapez @ pour mentionner"
              value={newComment}
              onChange={handleTextChange}
              className="min-h-[100px] rounded-xl border-border bg-muted/5 p-4 pr-12 pb-12 text-sm focus-visible:ring-1 focus-visible:ring-primary/20"
              onKeyDown={handleKeyDown}
            />

            {/* @mention autocomplete dropdown */}
            {showMentionMenu && filteredMentions.length > 0 && (
              <div className="absolute bottom-14 left-2 z-50 max-h-48 w-64 overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                {filteredMentions.map((user, idx) => (
                  <button
                    key={user.id}
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      idx === mentionIndex
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/50"
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault() // Prevent textarea blur
                      insertMention(user)
                    }}
                    onMouseEnter={() => setMentionIndex(idx)}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback className="text-[10px] font-bold">
                        {user.name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate font-medium">{user.name}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <span className="hidden text-[10px] text-muted-foreground sm:inline">
                Ctrl + Enter pour envoyer
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={onAddComment}
                disabled={!newComment.trim() || isPending}
                className="h-8 w-8 rounded-full p-0"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comment List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 opacity-50 grayscale">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="animate-pulse text-xs font-medium">
              Chargement de l&apos;activité...
            </span>
          </div>
        ) : (
          <div className="space-y-8">
            {comments?.map((comment) => (
              <div key={comment.id} className="group flex gap-4">
                <Avatar className="h-9 w-9 shrink-0 border border-border shadow-sm">
                  <AvatarImage src={comment.Author.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/5 text-xs font-bold text-primary">
                    {comment.Author.name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {comment.Author.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                      •
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {format(new Date(comment.createdAt), "d MMM, HH:mm", {
                        locale: fr,
                      })}
                    </span>
                  </div>
                  <div className="rounded-2xl rounded-tl-none border border-border/60 bg-muted/10 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                    {comment.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {comments?.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed py-16 opacity-40">
            <Send className="h-8 w-8" />
            <p className="max-w-[200px] text-center text-xs font-medium tracking-widest uppercase">
              Soyez le premier à laisser un commentaire
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
