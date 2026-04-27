import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPost, getPostsByLocale, getAlternateUrl } from '@/lib/blog'
import BlogArticle from '@/components/BlogArticle'

const BASE = 'https://splitvote.io'

interface Props {
  params: { slug: string }
}

export function generateStaticParams() {
  return getPostsByLocale('en').map((p) => ({ slug: p.slug }))
}

export function generateMetadata({ params }: Props): Metadata {
  const post = getPost(params.slug, 'en')
  if (!post) return {}

  const canonical = `${BASE}/blog/${post.slug}`
  const alternateIt = getAlternateUrl(post)

  return {
    title: post.seoTitle,
    description: post.seoDescription,
    alternates: {
      canonical,
      languages: {
        en: canonical,
        ...(alternateIt ? { it: alternateIt } : {}),
        'x-default': canonical,
      },
    },
    openGraph: {
      title: post.seoTitle,
      description: post.seoDescription,
      url: canonical,
      type: 'article',
      publishedTime: post.date,
      tags: post.tags,
    },
  }
}

export default function BlogPostPage({ params }: Props) {
  const post = getPost(params.slug, 'en')
  if (!post) notFound()

  return <BlogArticle post={post} localePrefix="" />
}
