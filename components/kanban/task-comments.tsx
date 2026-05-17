"use client"

import { type FC } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, Send } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

import { type KanbanTaskComment, type CurrentUser } from "@/lib/types"

interface TaskCommentsProps {
  comments: KanbanTaskComment[] | undefined
  isLoading: boolean
  currentUser: CurrentUser | null
  newComment: string
  isPending: boolean
  onCommentChange: (value: string) => void
  onAddComment: () => void
}

export const TaskComments: FC<TaskCommentsProps> = ({
  comments,
  isLoading,
  currentUser,
  newComment,
  isPending,
  onCommentChange,
  onAddComment,
}) => {
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
              placeholder="Écrivez un commentaire..."
              value={newComment}
              onChange={(e) => onCommentChange(e.target.value)}
              className="min-h-[100px] rounded-xl border-border bg-muted/5 p-4 pr-12 pb-12 text-sm focus-visible:ring-1 focus-visible:ring-primary/20"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  e.preventDefault()
                  onAddComment()
                }
              }}
            />
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
