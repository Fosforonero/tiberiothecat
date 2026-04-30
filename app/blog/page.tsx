import type { Metadata } from 'next'
import Link from 'next/link'
import { getPostsByLocale } from '@/lib/blog'
import BlogShareButton from '@/components/BlogShareButton'

export const revalidate = 86400

const BASE = 'https://splitvote.io'

export const metadata: Metadata = {
  title: 'Blog — Ethics, Philosophy & Moral Dilemmas',
  description:
    'Short articles on moral philosophy, ethics, and the psychology behind impossible choices. Paired with real dilemmas you can vote on.',
  alternates: {
    canonical: `${BASE}/blog`,
    languages: {
      en: `${BASE}/blog`,
      it: `${BASE}/it/blog`,
      'x-default': `${BASE}/blog`,
    },
  },
  openGraph: {
    title: 'SplitVote Blog — Ethics & Moral Philosophy',
    description:
      'Short articles on moral philosophy, ethics, and the psychology behind impossible choices.',
    url: `${BASE}/blog`,
    type: 'website',
  },
}

export default function BlogIndexPage() {
  const posts = getPostsByLocale('en')

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="mb-12">
        <Link href="/" className="text-sm text-[var(--muted)] hover:text-white transition-colors mb-6 inline-block">
          ← Home
        </Link>
        <h1 className="text-3xl md:text-4xl font-black text-[var(--text)] mb-3">Blog</h1>
        <p className="text-[var(--muted)] text-base leading-relaxed max-w-2xl">
          Short reads on moral philosophy, ethics, and the psychology behind impossible choices.
          Every article links to real dilemmas you can vote on.
        </p>
      </div>

      <div className="neon-divider mb-10 max-w-xs" />

      <div className="grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="group flex flex-col rounded-2xl border border-[var(--border)] hover:border-[var(--border-hi)] hover:bg-white/5 transition-all"
          >
            {/* Clickable upper area: tags + title + description */}
            <Link
              href={`/blog/${post.slug}`}
              className="block p-6 pb-3 flex-1"
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
              <p className="text-[var(--muted)] text-sm leading-relaxed">
                {post.description}
              </p>
            </Link>

            {/* Footer: date · read time · share · read CTA */}
            <div className="px-6 pb-5 flex items-center gap-2 text-xs text-[var(--muted)] flex-wrap">
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              <span>·</span>
              <span>{post.readingTime} min read</span>
              <div className="ml-auto flex items-center gap-2">
                <BlogShareButton
                  title={post.title}
                  text={post.description}
                  url={`${BASE}/blog/${post.slug}`}
                  locale="en"
                  slug={post.slug}
                  target="blog_card"
                />
                <Link
                  href={`/blog/${post.slug}`}
                  aria-label={`Read ${post.title}`}
                  className="text-violet-400 font-semibold hover:translate-x-0.5 transition-transform inline-block"
                >
                  Read →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-[var(--border)] text-center">
        <p className="text-xs text-[var(--muted)] mb-3">Prefer to vote instead?</p>
        <Link
          href="/trending"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold text-sm transition-all"
        >
          See trending dilemmas →
        </Link>
      </div>
    </div>
  )
}
