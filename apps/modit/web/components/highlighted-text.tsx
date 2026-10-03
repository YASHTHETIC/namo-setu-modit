"use client";

interface HighlightedTextProps {
  text: string;
  query: string;
  markClassName?: string;
}

/** Bold the matching substring (search suggestions, dropdowns). */
export function HighlightedText({ text, query, markClassName = "text-[#7CB518]" }: HighlightedTextProps) {
  const q = query.trim().toLowerCase();
  const i = q ? text.toLowerCase().indexOf(q) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className={`bg-transparent font-bold ${markClassName}`}>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}
