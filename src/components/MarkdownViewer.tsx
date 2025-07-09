import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewerProps {
  content: string;
  highlights?: Array<{type: string; text: string}>;
  className?: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ 
  content, 
  highlights = [],
  className = '' 
}) => {
  // Process content to add highlight markers
  let processedContent = content;
  
  if (highlights.length > 0) {
    highlights.forEach((highlight) => {
      const highlightClass = getHighlightClass(highlight.type);
      const icon = getHighlightIcon(highlight.type);
      
      // Escape special regex characters in the text
      const escapedText = highlight.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Wrap the highlighted text with a special marker
      processedContent = processedContent.replace(
        new RegExp(escapedText, 'gi'),
        `<mark class="${highlightClass}">${icon} $&</mark>`
      );
    });
  }

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom rendering for marks
          mark: ({ children, ...props }) => {
            const className = (props as any).className || '';
            return <mark className={`${className} px-1 py-0.5 rounded`}>{children}</mark>;
          },
          // Style adjustments for other elements
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 mt-6">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-medium mb-2 mt-4">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-4">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-4">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          p: ({ children }) => <p className="mb-4">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">
              {children}
            </blockquote>
          ),
          code: ({ children, ...props }) => {
            const isInline = !props.node?.position;
            return isInline ? (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">{children}</code>
            ) : (
              <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
                <code>{children}</code>
              </pre>
            );
          },
        }}
        // Allow HTML for highlights
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

function getHighlightClass(type: string): string {
  const classes: Record<string, string> = {
    decision: 'bg-blue-100 text-blue-800',
    concern: 'bg-red-100 text-red-800',
    agreement: 'bg-green-100 text-green-800',
    question: 'bg-yellow-100 text-yellow-800',
    commitment: 'bg-purple-100 text-purple-800',
  };
  return classes[type] || 'bg-gray-100 text-gray-800';
}

function getHighlightIcon(type: string): string {
  const icons: Record<string, string> = {
    decision: '🎯',
    concern: '⚠️',
    agreement: '🤝',
    question: '❓',
    commitment: '✅',
  };
  return icons[type] || '📌';
}