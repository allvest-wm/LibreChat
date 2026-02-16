import { useCallback } from 'react';
import { useChatFormContext } from '~/Providers';
import { mainTextareaId } from '~/common';

const suggestedPrompts = [
  'Analyze my portfolio',
  'How to diversify my holdings?',
  'Trending stocks to watch',
];

const SuggestedPrompts = () => {
  const { setValue } = useChatFormContext();

  const handlePromptClick = useCallback(
    (prompt: string) => {
      setValue('text', prompt, { shouldDirty: true });
      const textarea = document.getElementById(mainTextareaId) as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(prompt.length, prompt.length);
      }
    },
    [setValue],
  );

  return (
    <div className="mt-3 flex flex-wrap justify-center gap-2 px-4">
      {suggestedPrompts.map((prompt, index) => (
        <button
          key={index}
          type="button"
          onClick={() => handlePromptClick(prompt)}
          className="cursor-pointer rounded-full border border-border-medium bg-surface-secondary px-4 py-2 text-sm text-text-secondary transition-colors duration-200 hover:bg-surface-tertiary hover:text-text-primary"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
};

export default SuggestedPrompts;
