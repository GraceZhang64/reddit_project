import React from 'react';
import { Post } from '../types';
import { formatMentions } from '../utils/formatMentions';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import './PostContent.css';

interface PostContentProps {
  post: Post;
  isFullView?: boolean;
}

// Custom sanitize schema for markdown - allow common formatting but block dangerous elements
const markdownSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    // Allow common attributes for safe elements
    a: ['href', 'title', 'rel'],
    img: ['src', 'alt', 'title'],
    code: ['className'],
    pre: ['className'],
    // Block dangerous attributes
    '*': defaultSchema.attributes ? (defaultSchema.attributes['*'] as string[]).filter(attr => !['onclick', 'onload', 'onerror', 'style'].includes(attr)) : []
  },
  // Allow safe elements
  tagNames: [
    'p', 'br', 'strong', 'em', 'u', 's', 'blockquote', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'a', 'img', 'hr', 'del'
  ]
};

// Extract YouTube video ID from URL
function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// Extract Vimeo video ID from URL
function getVimeoId(url: string): string | null {
  const regExp = /vimeo.*\/(\d+)/i;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

function PostContent({ post, isFullView = false }: PostContentProps) {
  const postType = post.post_type || 'text';

  // Text post
  if (postType === 'text') {
    if (!post.body) return null;

    // For preview, truncate before processing markdown
    const content = isFullView ? post.body : (
      post.body.length > 300 ? `${post.body.substring(0, 300)}...` : post.body
    );

    return (
      <div className="post-text-content">
        <div className={isFullView ? "post-markdown-full" : "post-markdown-preview"}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[[rehypeSanitize, markdownSchema]]}
            components={{
              // Custom component to handle mentions within markdown
              p: ({ children, ...props }) => (
                <p {...props}>
                  {React.Children.map(children, (child) =>
                    typeof child === 'string' ? formatMentions(child) : child
                  )}
                </p>
              ),
              // Handle mentions in other elements too
              span: ({ children, ...props }) => (
                <span {...props}>
                  {React.Children.map(children, (child) =>
                    typeof child === 'string' ? formatMentions(child) : child
                  )}
                </span>
              )
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  // Poll post - show description if available
  if (postType === 'poll') {
    if (!post.body) return null;

    // For preview, truncate before processing markdown
    const content = isFullView ? post.body : (
      post.body.length > 300 ? `${post.body.substring(0, 300)}...` : post.body
    );

    return (
      <div className="post-text-content">
        <div className={isFullView ? "post-markdown-full" : "post-markdown-preview"}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[[rehypeSanitize, markdownSchema]]}
            components={{
              // Custom component to handle mentions within markdown
              p: ({ children, ...props }) => (
                <p {...props}>
                  {React.Children.map(children, (child) =>
                    typeof child === 'string' ? formatMentions(child) : child
                  )}
                </p>
              ),
              // Handle mentions in other elements too
              span: ({ children, ...props }) => (
                <span {...props}>
                  {React.Children.map(children, (child) =>
                    typeof child === 'string' ? formatMentions(child) : child
                  )}
                </span>
              )
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  return null;
}

export default PostContent;

