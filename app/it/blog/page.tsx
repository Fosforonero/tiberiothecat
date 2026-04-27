import type { Metadata } from 'next'
import Link from 'next/link'
import { getPostsByLocale } from '@/lib/blog'

const BASE = 'https://splitvote.io'

export const metadata: Metadata = {
  title: 'Blog — Etica, Filosofia e Dilemmi Morali',
  description:
    'Articoli brevi su filosofia morale, etica e la psicologia dietro le scelte impossibili. Ogni articolo è collegato a dilemmi reali su cui puoi votare.',
  alternates: {
    canonical: `${BASE}/it/blog`,
    languages: {
      it: `${BASE}/it/blog`,
      en: `${BASE}/blog`,
      'x-default': `${BASE}/blog`,
    },
  },
  openGraph: {
    title: 'SplitVote Blog — Etica e Filosofia Morale',
    description:
      'Articoli brevi su filosofia morale, etica e la psicologia dietro le scelte impossibili.',
    url: `${BASE}/it/blog`,
    type: 'website',
    locale: 'it_IT',
  },
}

export default function ITBlogIndexPage() {
  const posts = getPostsByLocale('it')

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="mb-12">
        <Link href="/it" className="text-sm text-[var(--muted)] hover:text-white transition-colors mb-6 inline-block">
          ← Home
        </Link>
        <h1 className="text-3xl md:text-4xl font-black text-[var(--text)] mb-3">Blog</h1>
        <p className="text-[var(--muted)] text-base leading-relaxed">
          Letture brevi su filosofia morale, etica e la psicologia dietro le scelte impossibili.
          Ogni articolo è collegato a dilemmi reali su cui puoi votare.
        </p>
      </div>

      <div className="neon-divider mb-10 max-w-xs" />

      <div className="grid gap-6">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/it/blog/${post.slug}`}
            className="group block rounded-2xl border border-[var(--border)] p-6 hover:border-[var(--border-hi)] hover:bg-white/5 transition-all"
          >
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="text-lg font-black text-[var(--text)] group-hover:text-white transition-colors mb-2 leading-snug">
              {post.title}
            </h2>
            <p className="text-[var(--muted)] text-sm leading-relaxed mb-4">
              {post.description}
            </p>
            <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('it-IT', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              <span>·</span>
              <span>{post.readingTime} min di lettura</span>
              <span className="ml-auto text-violet-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                Leggi →
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-[var(--border)] text-center">
        <p className="text-xs text-[var(--muted)] mb-3">Preferisci votare?</p>
        <Link
          href="/it/trending"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold text-sm transition-all"
        >
          Vedi i dilemmi di tendenza →
        </Link>
      </div>
    </div>
  )
}
