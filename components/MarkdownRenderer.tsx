
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const formatContent = (text: string) => {
    let html = text;

    const codeBlocks: string[] = [];
    html = html.replace(/```([\s\S]*?)```/g, (_, p1) => {
      const isDiagram = p1.includes('→') || p1.includes('|') || p1.includes('---') || p1.includes('Client');
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
      
      const formatted = isDiagram 
        ? `<figure class="bg-slate-900 text-cyan-300 p-6 rounded-2xl overflow-x-auto my-6 font-mono text-sm border border-slate-800 shadow-inner relative group">
            <figcaption class="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-bold tracking-widest border-b border-slate-800 pb-2 mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20L4 4m0 16L20 4"></path></svg>
              Architectural Schema
            </figcaption>
            <div class="leading-relaxed" aria-label="ASCII Architecture Diagram">${p1.trim()}</div>
          </figure>`
        : `<div class="relative group my-6">
            <pre class="bg-slate-950 text-cyan-400 p-5 rounded-xl overflow-x-auto font-mono text-xs border border-slate-800 shadow-xl"><code>${p1.trim()}</code></pre>
          </div>`;
      
      codeBlocks.push(formatted);
      return placeholder;
    });

    html = html
      .replace(/^# (.*$)/gim, '<h2 class="text-2xl font-bold text-white mb-6 mt-2">$1</h2>')
      .replace(/^## (.*$)/gim, '<h3 class="text-lg font-bold text-cyan-400 mt-8 mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">$1</h3>')
      .replace(/^### (.*$)/gim, '<h4 class="text-md font-bold text-slate-200 mt-6 mb-3">$1</h4>')
      .replace(/^(?:\*\*)?Concept overview:?(?:\*\*)?/gim, '<div class="bg-cyan-500/5 border-l-4 border-cyan-500 p-5 my-6 rounded-r-2xl"><span class="block text-[10px] font-black text-cyan-500 uppercase mb-2 tracking-widest">Core Insight</span>')
      .replace(/^(?:\*\*)?Hands-on lab:?(?:\*\*)?/gim, '<div class="bg-indigo-500/5 border-l-4 border-indigo-500 p-5 my-6 rounded-r-2xl"><span class="block text-[10px] font-black text-indigo-500 uppercase mb-2 tracking-widest">Step-by-Step Lab</span>')
      .replace(/^(?:\*\*)?Checkpoint question:?(?:\*\*)?/gim, '<div class="bg-amber-500/5 border-l-4 border-amber-500 p-5 my-6 rounded-r-2xl"><span class="block text-[10px] font-black text-amber-500 uppercase mb-2 tracking-widest">Self Review</span>')
      .replace(/^---$/gim, '<hr class="my-8 border-slate-800" />');

    html = html
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white underline decoration-cyan-500/30 decoration-2 underline-offset-4">$1</strong>')
      .replace(/__(.*?)__/g, '<strong class="font-bold text-white underline decoration-cyan-500/30 underline-offset-4">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-300">$1</em>')
      .replace(/_(.*?)_/g, '<em class="italic text-slate-300">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');

    html = html.replace(/^\s*[\*\-]\s+(.*$)/gim, '<li class="mb-2 ml-1">$1</li>');

    codeBlocks.forEach((block, i) => {
      html = html.replace(`__CODE_BLOCK_${i}__`, block);
    });

    const lines = html.split(/\n\n+/);
    html = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<div') || trimmed.startsWith('<hr') || trimmed.startsWith('<figure') || trimmed.startsWith('<ul')) {
        return trimmed;
      }
      if (trimmed.includes('<li')) {
        if (trimmed.startsWith('<li')) {
           return `<ul class="list-disc ml-6 mb-6 text-slate-400 space-y-1">${trimmed}</ul>`;
        }
        return `<p class="mb-4 leading-relaxed text-slate-400">${trimmed}</p>`;
      }
      return `<p class="mb-4 leading-relaxed text-slate-400">${trimmed}</p>`;
    }).join('\n');

    return { __html: html };
  };

  return (
    <section 
      className="markdown-content whitespace-pre-wrap break-words text-[15px] leading-relaxed"
      dangerouslySetInnerHTML={formatContent(content)}
    />
  );
};

export default MarkdownRenderer;
