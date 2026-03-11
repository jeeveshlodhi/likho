/**
 * Feedback Button Component
 * 
 * A floating button with dropdown menu for different feedback types.
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageSquare, Bug, Sparkles, ThumbsUp, ChevronUp } from 'lucide-react';
import { FeedbackDialog } from './FeedbackDialog';
import { FeedbackType } from '@/types/feedback';

interface FeedbackButtonProps {
  variant?: 'floating' | 'button';
  className?: string;
}

const feedbackOptions: { type: FeedbackType; icon: React.ReactNode; label: string }[] = [
  { type: 'bug', icon: <Bug className="w-4 h-4" />, label: 'Report a Bug' },
  { type: 'feature', icon: <Sparkles className="w-4 h-4" />, label: 'Request Feature' },
  { type: 'praise', icon: <ThumbsUp className="w-4 h-4" />, label: 'Share Praise' },
];

export function FeedbackButton({ 
  variant = 'floating',
  className,
}: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<FeedbackType>('bug');

  const handleSelectType = (type: FeedbackType) => {
    setDefaultType(type);
    setDialogOpen(true);
    setIsOpen(false);
  };

  if (variant === 'floating') {
    return (
      <>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              className={`fixed bottom-6 right-6 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50 gap-2 ${className}`}
              size="lg"
            >
              <MessageSquare className="w-5 h-5" />
              Feedback
              <ChevronUp className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {feedbackOptions.map(({ type, icon, label }) => (
              <DropdownMenuItem
                key={type}
                onClick={() => handleSelectType(type)}
                className="gap-2 cursor-pointer"
              >
                {icon}
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <FeedbackDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      </>
    );
  }

  // Button variant
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setDefaultType('bug');
          setDialogOpen(true);
        }}
        className={className}
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        Feedback
      </Button>
      
      <FeedbackDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}

export default FeedbackButton;
