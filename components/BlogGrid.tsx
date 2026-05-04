'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { BlogPost } from '@/lib/blog'
import BlogShareButton from './BlogShareButton'

const ITEMS_DESKTOP = 9
const ITEMS_MOBILE = 4
const MOBILE_BREAKPOINT = 768

const BASE = 'https://splitvote.io'

interface Props {
  posts: BlogPost[]
  locale: 'en' | 'it'
}

function useItemsPerPage(): number {
  const [items, setItems] = useState(ITEMS_DESKTOP)
  useEffect(() => {
    function update() {
      setItems(window.innerWidth < MOBILE_BREAKPOINT ? ITEMS_MOBILE : ITEMS_DESKTOP)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return items
}

export default function BlogGrid({ posts, locale }: Props) {
  const [page, setPage] = useState(0)
  const itemsPerPage = useItemsPerPage()
  const totalPages = Math.max(1, Math.ceil(posts.length / itemsPerPage))
  const visiblePosts = posts.slice(page * itemsPerPage, (page + 1) * itemsPerPage)

  useEffect(() => { setPage(0) }, [itemsPerPage])

  const basePath = locale === 'it' ? '/it/blog' : '/blog'
  const dateLocale = locale === 'it' ? 'it-IT' : 'en-US'
  const readingLabel = locale === 'it' ? 'min di lettura' : 'min read'
  const readLabel = locale === 'it' ? 'Leggi →' : 'Read →'
  const prevLabel = locale === 'it' ? '← Precedente' : '← Previous'
  const nextLabel = locale === 'it' ? 'Successivo →' : 'Next →'

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visiblePosts.map((post) => (
          <article
            key={post.slug}
            className="group flex flex-col rounded-2xl border border-[var(--border)] hover:border-[var(--border-hi)] hover:bg-white/5 transition-all"
          >
            <Link href={`${basePath}/${post.slug}`} className="block p-6 pb-3 flex-1">
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

            <div className="px-6 pb-5 flex items-center gap-2 text-xs text-[var(--muted)] flex-wrap">
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString(dateLocale, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              <span>·</span>
              <span>{post.readingTime} {readingLabel}</span>
              <div className="ml-auto flex items-center gap-2">
                <BlogShareButton
                  title={post.title}
                  text={post.description}
                  url={`${BASE}${basePath}/${post.slug}`}
                  locale={locale}
                  slug={post.slug}
                  target="blog_card"
                />
                <Link
                  href={`${basePath}/${post.slug}`}
                  aria-label={`${locale === 'it' ? 'Leggi' : 'Read'} ${post.title}`}
                  className="text-violet-400 font-semibold hover:translate-x-0.5 transition-transform inline-block"
                >
                  {readLabel}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:text-white hover:border-[var(--border-hi)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {prevLabel}
          </button>
          <span className="text-sm text-[var(--muted)] tabular-nums">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages - 1}
            className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:text-white hover:border-[var(--border-hi)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {nextLabel}
          </button>
        </div>
      )}
    </>
  )
}
