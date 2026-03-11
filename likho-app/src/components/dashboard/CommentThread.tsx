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
    <div className="w-80 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Comments</h4>
        <span className="text-xs text-muted-foreground">
          {filteredComments.length} comment{filteredComments.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="max-h-[60vh] space-y-3 overflow-y-auto">
        {filteredComments.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            No comments yet
            {canComment && '. Be the first to share your thoughts!'}
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

      {canComment && !replyingTo && (
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none"
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
        'rounded-lg border p-3',
        isResolved && 'bg-muted opacity-60',
        isReply && 'ml-4 border-l-2'
      )}
    >
      <div className="flex items-start gap-2">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-xs">
            {comment.author.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{comment.author.name}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canResolve && !isResolved && (
                    <DropdownMenuItem onClick={onResolve}>
                      <Check size={14} className="mr-2" />
                      Resolve
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 size={14} className="mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <p className="mt-1 text-sm">{content}</p>

          {isResolved && comment.resolved_by && (
            <p className="mt-1 text-xs text-muted-foreground">
              Resolved by {comment.resolved_by.name}
            </p>
          )}

          {/* Reactions */}
          {Object.entries(comment.reactions).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(comment.reactions).map(([emoji, count]) => (
                <button
                  key={emoji}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs hover:bg-muted/80"
                >
                  {emoji} {count}
                </button>
              ))}
            </div>
          )}

          {/* Reply button */}
          {canComment && !isResolved && (
            <div className="mt-2 flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onReply}>
                <CornerDownRight size={12} className="mr-1" />
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
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border bg-popover p-4 shadow-lg">
          <CommentThread pageId={pageId} canComment canResolve />
        </div>
      )}
    </div>
  );
}
