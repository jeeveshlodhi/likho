/**
 * Threaded comments component for page collaboration.
 */
import { useState } from 'react';
import { MessageSquare, Check, Trash2, MoreHorizontal, CornerDownRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { usePageComments, useCollaboration } from '@/hooks/useCollaboration';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  page_id: string;
  block_id?: string;
  yjs_mark_id?: string;
  parent_id?: string;
  author: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  content: {
    type: string;
    content: Array<{ type: string; text: string }>;
  };
  resolved_at?: string;
  resolved_by?: {
    id: string;
    name: string;
  };
  reactions: Record<string, number>;
  edited_at?: string;
  created_at: string;
  replies?: Comment[];
}

interface CommentThreadProps {
  pageId: string;
  blockId?: string;
  canComment: boolean;
  canResolve: boolean;
}

const EMOJI_REACTIONS = ['👍', '❤️', '🎉', '🤔', '👀'];

export function CommentThread({ pageId, blockId, canComment, canResolve }: CommentThreadProps) {
  const { comments, isLoading, createComment, resolveComment, deleteComment } = usePageComments(pageId);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const { toast } = useToast();

  const filteredComments = blockId
    ? comments.filter((c: Comment) => c.block_id === blockId)
    : comments;

  const handleSubmit = async (parentId?: string) => {
    if (!newComment.trim()) return;

    const content = {
      type: 'paragraph',
      content: [{ type: 'text', text: newComment }],
    };

    try {
      await createComment.mutateAsync({
        content,
        parentId,
      });
      setNewComment('');
      setReplyingTo(null);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      });
    }
  };

  const handleResolve = async (commentId: string) => {
    try {
      await resolveComment.mutateAsync(commentId);
      toast({ title: 'Comment resolved' });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to resolve comment',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync(commentId);
      toast({ title: 'Comment deleted' });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading comments...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-primary" />
          <h4 className="font-semibold text-sm">Comments</h4>
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted">
          {filteredComments.length}
        </span>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {filteredComments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <MessageSquare size={20} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">No comments yet</p>
            {canComment && (
              <p className="text-xs text-muted-foreground mt-1">Be the first to share your thoughts!</p>
            )}
          </div>
        )}

        {filteredComments.map((comment: Comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            isReply={false}
            canComment={canComment}
            canResolve={canResolve}
            onReply={() => setReplyingTo(comment.id)}
            onResolve={() => handleResolve(comment.id)}
            onDelete={() => handleDelete(comment.id)}
          />
        ))}
      </div>

      {/* New Comment Input */}
      {canComment && !replyingTo && (
        <div className="px-4 py-4 border-t border-border bg-muted/30">
          <div className="space-y-3">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[90px] resize-none bg-background border-muted-foreground/20 focus:border-primary/50 text-sm"
            />
            <Button
              onClick={() => handleSubmit()}
              disabled={!newComment.trim() || createComment.isPending}
              size="sm"
              className="w-full"
            >
              {createComment.isPending ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  isReply: boolean;
  canComment: boolean;
  canResolve: boolean;
  onReply: () => void;
  onResolve: () => void;
  onDelete: () => void;
}

function CommentItem({
  comment,
  isReply,
  canComment,
  canResolve,
  onReply,
  onResolve,
  onDelete,
}: CommentItemProps) {
  const isResolved = !!comment.resolved_at;
  const content = comment.content?.content?.[0]?.text || '';

  return (
    <div
      className={cn(
        'group rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md',
        isResolved && 'bg-muted/50 opacity-70',
        isReply && 'ml-4 border-l-4 border-l-primary'
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 shrink-0 ring-2 ring-background shadow-sm">
          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
            {comment.author.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Header: Name, Time, Menu */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold truncate">{comment.author.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <MoreHorizontal size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {canResolve && !isResolved && (
                  <DropdownMenuItem onClick={onResolve} className="text-xs">
                    <Check size={14} className="mr-2" />
                    Resolve
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onDelete} className="text-xs text-destructive">
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          <p className="mt-2 text-sm text-foreground leading-relaxed">{content}</p>

          {/* Resolved Badge */}
          {isResolved && comment.resolved_by && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check size={12} className="text-green-500" />
              <span>Resolved by {comment.resolved_by.name}</span>
            </div>
          )}

          {/* Reactions */}
          {Object.entries(comment.reactions).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(comment.reactions).map(([emoji, count]) => (
                <button
                  key={emoji}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs hover:bg-muted/80 transition-colors"
                >
                  <span>{emoji}</span>
                  <span className="font-medium text-muted-foreground">{count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Reply button */}
          {canComment && !isResolved && (
            <div className="mt-3 pt-2 border-t border-border/50">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground" 
                onClick={onReply}
              >
                <CornerDownRight size={12} />
                Reply
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommentButton({
  pageId,
  commentCount = 0,
}: {
  pageId: string;
  commentCount?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-1.5"
      >
        <MessageSquare size={16} />
        {commentCount > 0 && <span>{commentCount}</span>}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[340px] rounded-xl border bg-popover shadow-xl overflow-hidden max-h-[70vh] flex flex-col">
          <CommentThread pageId={pageId} canComment canResolve />
        </div>
      )}
    </div>
  );
}
