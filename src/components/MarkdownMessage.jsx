import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const components = {
  p: ({ children }) => <p className="text-xs leading-relaxed whitespace-pre-wrap my-1" style={{ color: "#001a33" }}>{children}</p>,
  strong: ({ children }) => <strong className="font-bold" style={{ color: "#001a33" }}>{children}</strong>,
  em: ({ children }) => <em style={{ color: "#001a33" }}>{children}</em>,
  ul: ({ children }) => <ul className="text-xs leading-relaxed my-1.5 pl-4" style={{ color: "#001a33" }}>{children}</ul>,
  ol: ({ children }) => <ol className="text-xs leading-relaxed my-1.5 pl-4 list-decimal" style={{ color: "#001a33" }}>{children}</ol>,
  li: ({ children }) => <li className="my-0.5" style={{ color: "#001a33" }}>{children}</li>,
  h1: ({ children }) => <h1 className="text-sm font-bold my-1.5" style={{ color: "#001a33" }}>{children}</h1>,
  h2: ({ children }) => <h2 className="text-[13px] font-bold my-1.5" style={{ color: "#001a33" }}>{children}</h2>,
  h3: ({ children }) => <h3 className="text-xs font-bold my-1" style={{ color: "#001a33" }}>{children}</h3>,
  code: ({ children }) => (
    <code className="px-1 py-0.5 rounded text-[11px]" style={{ background: "rgba(0,102,204,0.08)", color: "#0066cc" }}>
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-1.5 rounded-lg p-2.5 overflow-x-auto text-[11px]" style={{ background: "#0f172a", color: "#e2e8f0" }}>
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-1.5 pl-2.5 border-l-2" style={{ borderColor: "rgba(0,102,204,0.3)", color: "#004999" }}>
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="underline" style={{ color: "#0066cc" }}>
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-1.5 overflow-x-auto">
      <table className="text-[11px] border-collapse" style={{ color: "#001a33" }}>{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border px-2 py-1 font-bold text-left" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#001a33" }}>{children}</th>,
  td: ({ children }) => <td className="border px-2 py-1" style={{ borderColor: "rgba(0,0,0,0.1)", color: "#001a33" }}>{children}</td>,
  hr: () => <hr className="my-2" style={{ borderColor: "rgba(0,0,0,0.08)" }} />,
};

export default function MarkdownMessage({ content }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
