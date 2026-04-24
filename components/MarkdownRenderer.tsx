
import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const sanitizedHtml = useMemo(() => {
    if (!content) return '';
    
    // Configura o marked para quebras de linha automáticas
    marked.setOptions({
      breaks: true,
      gfm: true
    });

    const rawHtml = marked.parse(content) as string;
    return DOMPurify.sanitize(rawHtml);
  }, [content]);

  return (
    <div 
      className="prose prose-slate prose-sm md:prose-base text-inherit"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export default MarkdownRenderer;
