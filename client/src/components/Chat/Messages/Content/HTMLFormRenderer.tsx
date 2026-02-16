/* eslint-disable i18next/no-literal-string */
import React, { useEffect } from 'react';
import { UIResourceRenderer } from '@mcp-ui/client';
import type { UIResource } from 'librechat-data-provider';
import useSubmitMessage from '~/hooks/Messages/useSubmitMessage';

interface HTMLFormRendererProps {
  resource: UIResource;
}

interface FormData {
  formType?: string;
  title?: string;
  sections?: Array<any>;
  totalQuestions?: number;
}

const HTMLFormRenderer: React.FC<HTMLFormRendererProps> = ({ resource }) => {
  console.log('📋 HTMLFormRenderer - Full resource:', resource);

  const formData = resource.data as FormData;
  const { submitMessage } = useSubmitMessage();

  console.log('📋 HTMLFormRenderer - formData:', formData);

  // Listen for form submission messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('📋 HTMLFormRenderer - Received message:', event.data);

      // Check if it's a questionnaire submission
      if (event.data?.type === 'questionnaire_submit') {
        const { answers, details } = event.data.data || {};
        console.log('Answer and details:', answers, details);
        submitMessage({ text: answers });
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [submitMessage]);

  // Validate form data
  if (!formData) {
    console.error('❌ HTMLFormRenderer - Invalid form data:', {
      hasFormData: !!formData,
      resource,
    });
    return (
      <div className="flex h-full items-center justify-center rounded-lg bg-surface-tertiary p-4 text-text-secondary">
        <p>Invalid form data</p>
      </div>
    );
  }

  const { formType = 'questionnaire', title = 'Form', totalQuestions = 0 } = formData;

  console.log('📋 HTMLFormRenderer - Extracted values:', {
    formType,
    title,
    totalQuestions,
  });

  return (
    <div className="group relative overflow-hidden p-4">
      <div className="relative z-10 flex h-full flex-col">
        {title && (
          <div className="mb-4 text-center">
            <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {title}
            </h3>
            {totalQuestions > 0 && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {totalQuestions} questions to complete
              </p>
            )}
          </div>
        )}

        <div className="flex-1">
          <UIResourceRenderer
            resource={resource}
            onUIAction={async (result) => {
              console.log('📋 HTMLFormRenderer - UI Action:', result);
            }}
            htmlProps={{
              autoResizeIframe: { width: true, height: true },
              sandboxPermissions: 'allow-same-origin allow-scripts allow-forms',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default HTMLFormRenderer;
