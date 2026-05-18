import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Book, ArrowRight, Zap } from 'lucide-react';
import { getGlossaryTerm, getAllGlossaryTerms } from '@/lib/glossary';
import { breadcrumbSchema } from '@/lib/seo-helpers';
import ReaderHeader from '@/components/ReaderHeader';
import ReaderFooter from '@/components/ReaderFooter';

export async function generateStaticParams() {
  return getAllGlossaryTerms().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const term = getGlossaryTerm(slug);
  if (!term) return {};

  return {
    title: `${term.term} : définition complète — Glossaire Prospectia`,
    description: term.shortDef,
    alternates: { canonical: `https://prospectia.cloud/glossaire/${slug}` },
    openGraph: {
      title: `${term.term} : définition`,
      description: term.shortDef,
      url: `https://prospectia.cloud/glossaire/${slug}`,
    },
  };
}

// Same lightweight markdown renderer as blog
function renderMarkdown(md) {
  if (!md) return null;
  const lines = md.split('\n');
  const blocks = [];
  let currentList = null;
  let currentCodeBlock = null;
  let currentTable = null;
  let key = 0;

  const flushList = () => {
    if (currentList) {
      blocks.push(<ul key={key++} className="list-disc list-inside space-y-2 mb-4 text-content-secondary">{currentList}</ul>);
      currentList = null;
    }
  };
  const flushCodeBlock = () => {
    if (currentCodeBlock) {
      blocks.push(
        <pre key={key++} className="rounded-xl bg-surface-deep border border-line p-4 overflow-x-auto mb-4 text-xs text-content-secondary">
          <code>{currentCodeBlock.join('\n')}</code>
        </pre>
      );
      currentCodeBlock = null;
    }
  };
  const flushTable = () => {
    if (currentTable && currentTable.length > 1) {
      const [header, , ...rows] = currentTable;
      blocks.push(
        <div key={key++} className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b border-line-hover">{header.map((h, i) => <th key={i} className="text-left p-2 text-violet-400 font-semibold">{h}</th>)}</tr></thead>
            <tbody>{rows.map((row, i) => <tr key={i} className="border-b border-line">{row.map((cell, j) => <td key={j} className="p-2 text-content-secondary">{renderInline(cell)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    }
    currentTable = null;
  };

  const renderInline = (text) => {
    if (!text) return text;
    const parts = [];
    let lastIdx = 0;
    const regex = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;
    let m;
    let i = 0;
    while ((m = regex.exec(text)) !== null) {
      if (m.index > lastIdx) parts.push(text.slice(lastIdx, m.index));
      if (m[1]) parts.push(<strong key={`b${i++}`} className="text-content-primary font-semibold">{m[1]}</strong>);
      else if (m[2]) parts.push(<code key={`c${i++}`} className="px-1.5 py-0.5 rounded bg-surface-elevated text-violet-300 text-[0.9em]">{m[2]}</code>);
      else if (m[3] && m[4]) parts.push(<Link key={`l${i++}`} href={m[4]} className="text-violet-400 hover:underline">{m[3]}</Link>);
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < text.length) parts.push(text.slice(lastIdx));
    return parts.length ? parts : text;
  };

  for (const line of lines) {
    if (line.startsWith('```')) { if (currentCodeBlock) flushCodeBlock(); else { flushList(); flushTable(); currentCodeBlock = []; } continue; }
    if (currentCodeBlock) { currentCodeBlock.push(line); continue; }
    if (line.startsWith('|')) { flushList(); const cells = line.split('|').slice(1, -1).map((c) => c.trim()); if (!currentTable) currentTable = []; currentTable.push(cells); continue; }
    else if (currentTable) flushTable();
    if (line.startsWith('### ')) { flushList(); blocks.push(<h3 key={key++} className="text-lg font-bold mt-6 mb-2 text-content-primary">{renderInline(line.slice(4))}</h3>); }
    else if (line.startsWith('## ')) { flushList(); blocks.push(<h2 key={key++} className="text-2xl font-bold mt-8 mb-3 text-content-primary">{renderInline(line.slice(3))}</h2>); }
    else if (/^[-*]\s/.test(line)) { if (!currentList) currentList = []; currentList.push(<li key={key++}>{renderInline(line.replace(/^[-*]\s/, ''))}</li>); }
    else if (!line.trim()) flushList();
    else { flushList(); blocks.push(<p key={key++} className="text-content-secondary leading-relaxed mb-4">{renderInline(line)}</p>); }
  }
  flushList(); flushCodeBlock(); flushTable();
  return blocks;
}

export default async function GlossaryTermPage({ params }) {
  const { slug } = await params;
  const term = getGlossaryTerm(slug);
  if (!term) notFound();

  const allTerms = getAllGlossaryTerms();
  const relatedTerms = (term.related || []).map((s) => allTerms.find((t) => t.slug === s)).filter(Boolean);

  const breadcrumbs = [
    { label: 'Accueil', href: '/' },
    { label: 'Glossaire', href: '/glossaire' },
    { label: term.term },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbSchema(breadcrumbs),
      {
        '@type': 'DefinedTerm',
        name: term.term,
        description: term.shortDef,
        inDefinedTermSet: {
          '@type': 'DefinedTermSet',
          name: 'Glossaire Prospection B2B',
          url: 'https://prospectia.cloud/glossaire',
        },
        url: `https://prospectia.cloud/glossaire/${slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-surface-base text-content-primary">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ReaderHeader />

      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-8">
          <Link href="/glossaire" className="inline-flex items-center gap-2 text-sm text-content-tertiary hover:text-violet-400 transition">
            <ArrowLeft size={14} />
            Tous les termes
          </Link>
        </div>

        <article className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 mb-4">
            <Book size={12} />
            {term.category}
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-4 text-content-primary">
            {term.term}
          </h1>
          <p className="text-xl text-content-secondary leading-relaxed mb-10 pb-8 border-b border-line">
            {term.shortDef}
          </p>

          <div className="prose prose-invert max-w-none">
            {renderMarkdown(term.longDef)}
          </div>

          <div className="mt-12 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 p-8 text-center">
            <Zap size={32} className="text-violet-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">Mettez ce concept en pratique</h2>
            <p className="text-content-secondary mb-6 max-w-xl mx-auto">
              Prospectia trouve les emails B2B que vos concurrents ratent. 49€/mois, prospects illimités.
            </p>
            <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-500/30">
              <Zap size={16} />
              Essayer gratuitement
            </Link>
          </div>

          {relatedTerms.length > 0 && (
            <section className="mt-12">
              <h2 className="text-sm font-semibold text-content-secondary uppercase tracking-wider mb-4">Termes associés</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {relatedTerms.map((rt) => (
                  <Link key={rt.slug} href={`/glossaire/${rt.slug}`} className="block rounded-xl border border-line bg-surface-card hover:bg-surface-elevated hover:border-violet-500/30 transition p-4 group">
                    <h3 className="font-semibold mb-1 group-hover:text-violet-400 transition flex items-center gap-2">
                      {rt.term}
                      <ArrowRight size={12} />
                    </h3>
                    <p className="text-sm text-content-tertiary leading-snug">{rt.shortDef}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>

      <ReaderFooter />
    </div>
  );
}
