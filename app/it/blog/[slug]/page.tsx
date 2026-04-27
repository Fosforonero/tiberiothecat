import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPost, getPostsByLocale, getAlternateUrl } from '@/lib/blog'
import BlogArticle from '@/components/BlogArticle'

const BASE = 'https://splitvote.io'

interface Props {
  params: { slug: string }
}

export function generateStaticParams() {
  return getPostsByLocale('it').map((p) => ({ slug: p.slug }))
}

export function generateMetadata({ params }: Props): Metadata {
  const post = getPost(params.slug, 'it')
  if (!post) return {}

  const canonical = `${BASE}/it/blog/${post.slug}`
  const alternateEn = getAlternateUrl(post)

  return {
    title: post.seoTitle,
    description: post.seoDescription,
    alternates: {
      canonical,
      languages: {
        it: canonical,
        ...(alternateEn ? { en: alternateEn } : {}),
        'x-default': alternateEn ?? canonical,
      },
    },
    openGraph: {
      title: post.seoTitle,
      description: post.seoDescription,
      url: canonical,
      type: 'article',
      publishedTime: post.date,
      locale: 'it_IT',
      tags: post.tags,
    },
  }
}

export default function ITBlogPostPage({ params }: Props) {
  const post = getPost(params.slug, 'it')
  if (!post) notFound()

  return <BlogArticle post={post} localePrefix="/it" />
}
