'use client';

import { Fragment, type ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Tiny, safe Markdown: links to our own pages, **bold**, lists, paragraphs.
// Built as React elements (no HTML injection).
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) {
      const href = m[2];
      const internal = href.startsWith('/') && !href.startsWith('//');
      out.push(internal
        ? <Link key={`${key}-${i++}`} href={href} className="underline text-secondary font-medium">{m[1]}</Link>
        : href.startsWith('https://')
          ? <a key={`${key}-${i++}`} href={href} target="_blank" rel="noopener noreferrer nofollow" className="underline text-secondary">{m[1]}</a>
          : m[1]);
    } else {
      out.push(<strong key={`${key}-${i++}`}>{m[3]}</strong>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function AssistantMarkdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-2">
      {blocks.map((block, b) => {
        const lines = block.split('\n').filter((l) => l.trim());
        const isList = lines.length > 0 && lines.every((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l));
        if (isList) {
          const ordered = /^\s*\d/.test(lines[0]);
          const Tag = ordered ? 'ol' : 'ul';
          return (
            <Tag key={b} className={cn('pl-5 space-y-1', ordered ? 'list-decimal' : 'list-disc')}>
              {lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*([-*•]|\d+[.)])\s+/, ''), `${b}-${j}`)}</li>)}
            </Tag>
          );
        }
        return (
          <p key={b}>
            {lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l.replace(/^#+\s*/, ''), `${b}-${j}`)}</Fragment>)}
          </p>
        );
      })}
    </div>
  );
}
