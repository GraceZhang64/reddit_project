import { Link } from 'react-router-dom';

/**
 * Format text with clickable mention links
 * Converts @username to clickable links
 */
export function formatMentions(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = mentionRegex.exec(text)) !== null) {
    const beforeMatch = text.substring(lastIndex, match.index);
    if (beforeMatch) {
      parts.push(beforeMatch);
    }

    const username = match[1];
    // Don't create links for common false positives
    if (!['http', 'https', 'www'].includes(username.toLowerCase())) {
      parts.push(
        <Link
          key={`mention-${key++}`}
          to={`/u/${username}`}
          className="mention-link"
          onClick={(e) => e.stopPropagation()}
        >
          @{username}
        </Link>
      );
    } else {
      parts.push(match[0]);
    }

    lastIndex = mentionRegex.lastIndex;
  }

  const remaining = text.substring(lastIndex);
  if (remaining) {
    parts.push(remaining);
  }

  return parts.length > 0 ? parts : [text];
}

