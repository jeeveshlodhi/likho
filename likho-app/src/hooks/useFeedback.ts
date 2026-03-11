/**
 * useFeedback hook
 * 
 * Hook for managing the feedback dialog state.
 */
import { useState, useCallback } from 'react';
import { FeedbackType } from '@/types/feedback';

interface UseFeedbackReturn {
  isOpen: boolean;
  openFeedback: (type?: FeedbackType) => void;
  closeFeedback: () => void;
  defaultType: FeedbackType;
}

export function useFeedback(): UseFeedbackReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<FeedbackType>('bug');

  const openFeedback = useCallback((type: FeedbackType = 'bug') => {
    setDefaultType(type);
    setIsOpen(true);
  }, []);

  const closeFeedback = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    openFeedback,
    closeFeedback,
    defaultType,
  };
}

export default useFeedback;
