'use client';

import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

interface SafeHTMLProps {
  html: string;
  className?: string;
  tag?: React.ElementType;
}

/**
 * Composant de rendu HTML sécurisé (Anti-XSS).
 * Utilise DOMPurify pour sanitiser le contenu avant injection.
 */
export const SafeHTML: React.FC<SafeHTMLProps> = ({ 
  html, 
  className = "", 
  tag: Tag = 'div' 
}) => {
  const [sanitizedHTML, setSanitizedHTML] = useState<string>('');

  useEffect(() => {
    // Sanitisation uniquement côté client pour avoir accès au DOM
    if (typeof window !== 'undefined') {
      const clean = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'p', 'br', 'b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'span', 'div',
          'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'blockquote'
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'width', 'height']
      });
      setSanitizedHTML(clean);
    }
  }, [html]);

  // Rendu initial ou SSR (vide pour plus de sécurité)
  if (!sanitizedHTML) {
    return <Tag className={className} />;
  }

  return (
    <Tag 
      className={className} 
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }} 
    />
  );
};
