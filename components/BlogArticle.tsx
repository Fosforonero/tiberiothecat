import Link from 'next/link'
import type { BlogPost } from '@/lib/blog'
import { postUrl } from '@/lib/blog'
import { scenarios } from '@/lib/scenarios'
import { translateScenarioToItalian } from '@/lib/scenarios-it'
import BlogShareButton from '@/components/BlogShareButton'

interface Props {
  post: BlogPost
  localePrefix?: '' | '/it'
}

export default function BlogArticle({ post, localePrefix = '' }: Props) {
  const relatedScenarios = scenarios
    .filter((s) => post.relatedDilemmaIds.includes(s.id))
    .map((s) => post.locale === 'it' ? translateScenarioToItalian(s) : s)
  const blogIndexHref = localePrefix ? `${localePrefix}/blog` : '/blog'
  const backLabel = localePrefix === '/it' ? '← Blog' : '← Blog'

  return (
    <article className="max-w-2xl mx-auto px-4 py-16">
      {/* Back */}
      <Link
        href={blogIndexHref}
        className="text-sm text-[var(--muted)] hover:text-white transition-colors mb-8 inline-block"
      >
        {backLabel}
      </Link>

      {/* Header */}
      <header className="mb-10">
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] border border-[var(--border)] rounded-full px-3 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-[var(--text)] leading-tight mb-4">
          {post.title}
        </h1>
        <p className="text-[var(--muted)] text-base leading-relaxed mb-4">
          {post.description}
        </p>
        <div className="flex items-center gap-3 text-xs text-[var(--muted)] flex-wrap">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString(
              post.locale === 'it' ? 'it-IT' : 'en-US',
              { year: 'numeric', month: 'long', day: 'numeric' }
            )}
          </time>
          <span>·</span>
          <span>{post.readingTime} {post.locale === 'it' ? 'min di lettura' : 'min read'}</span>
          <BlogShareButton
            title={post.seoTitle}
            text={post.seoDescription}
            url={postUrl(post)}
            locale={post.locale}
            slug={post.slug}
            target="blog_article"
          />
        </div>
      </header>

      <div className="neon-divider mb-10 max-w-xs" />

      {/* Content */}
      <div className="prose-splitvote space-y-5">
        {post.content.map((section, i) => {
          if (section.type === 'h2') {
            return (
              <h2 key={i} className="text-xl font-black text-[var(--text)] mt-10 mb-3">
                {section.text}
              </h2>
            )
          }
          if (section.type === 'h3') {
            return (
              <h3 key={i} className="text-lg font-bold text-[var(--text)] mt-8 mb-2">
                {section.text}
              </h3>
            )
          }
          if (section.type === 'p') {
            return (
              <p key={i} className="text-[var(--text)] opacity-80 leading-relaxed">
                {section.text}
              </p>
            )
          }
          if (section.type === 'list') {
            return (
              <ul key={i} className="space-y-2 pl-4">
                {section.items.map((item, j) => (
                  <li key={j} className="flex gap-2 text-[var(--text)] opacity-80 leading-relaxed">
                    <span className="text-violet-400 flex-shrink-0 mt-1">–</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )
          }
          if (section.type === 'cta') {
            return (
              <div key={i} className="my-8">
                <Link
                  href={section.href}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold text-sm transition-all"
                >
                  {section.label}
                </Link>
              </div>
            )
          }
          if (section.type === 'disclaimer') {
            return (
              <p key={i} className="text-xs text-[var(--muted)] italic border-l-2 border-[var(--border)] pl-3 mt-8">
                {section.text}
              </p>
            )
          }
          return null
        })}
      </div>

      {/* Related dilemmas */}
      {relatedScenarios.length > 0 && (
        <div className="mt-14">
          <div className="neon-divider mb-8 max-w-xs" />
          <h2 className="text-sm font-black uppercase tracking-widest text-[var(--muted)] mb-4">
            {post.locale === 'it' ? 'Dilemmi correlati' : 'Related dilemmas'}
          </h2>
          <div className="grid gap-3">
            {relatedScenarios.map((s) => (
              <Link
                key={s.id}
                href={`${localePrefix}/play/${s.id}`}
                className="flex items-start gap-3 rounded-2xl border border-[var(--border)] p-4 hover:border-[var(--border-hi)] hover:bg-white/5 transition-all group"
              >
                <span className="text-2xl flex-shrink-0">{s.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-[var(--text)] leading-snug group-hover:text-white transition-colors">
                    {s.question}
                  </p>
                  <span className="text-xs text-violet-400 mt-1 inline-block">
                    {post.locale === 'it' ? 'Vota →' : 'Vote →'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back to blog */}
      <div className="mt-12 pt-8 border-t border-[var(--border)]">
        <Link
          href={blogIndexHref}
          className="text-sm text-[var(--muted)] hover:text-white transition-colors"
        >
          {post.locale === 'it' ? '← Torna al blog' : '← Back to blog'}
        </Link>
      </div>
    </article>
  )
}
