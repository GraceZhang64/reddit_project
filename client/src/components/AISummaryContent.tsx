import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface AISummaryContentProps {
  content: string;
}

// Renders trusted, sanitized Markdown for AI summaries
export default function AISummaryContent({ content }: AISummaryContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      // Map headings to smaller sizes to fit summary boxes
      components={{
        h1: (props) => <h4 {...props} />,
        h2: (props) => <h4 {...props} />,
        h3: (props) => <h4 {...props} />,
        h4: (props) => <h4 {...props} />,
        h5: (props) => <h5 {...props} />,
        h6: (props) => <h6 {...props} />,
        ul: (props) => <ul {...props} />,
        ol: (props) => <ol {...props} />,
        li: (props) => <li {...props} />,
        p: (props) => <p {...props} />,
        strong: (props) => <strong {...props} />,
        em: (props) => <em {...props} />,
        a: (props) => <a {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
