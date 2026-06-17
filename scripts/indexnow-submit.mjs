#!/usr/bin/env node
/**
 * IndexNow submitter for SplitVote.
 *
 * Reads the live sitemap, extracts every URL, and submits the full list to
 * IndexNow (Bing, Yandex, and partners pick it up from one endpoint).
 *
 * Run AFTER a deploy — IndexNow verifies ownership by fetching the key file
 * at KEY_LOCATION, so the key must already be live in production. The script
 * checks that first and aborts if the key file is not reachable.
 *
 * Usage (inside the Node 20 container, per project runtime policy):
 *   docker run --rm -v "$PWD":/app -w /app node:20-bullseye \
 *     node scripts/indexnow-submit.mjs            # submit everything
 *   docker run --rm -v "$PWD":/app -w /app node:20-bullseye \
 *     node scripts/indexnow-submit.mjs --dry-run  # list URLs, no submit
 *
 * Override the key with INDEXNOW_KEY env if it is ever rotated (must match the
 * public/<key>.txt file deployed to production).
 */

const HOST = 'splitvote.io'
const KEY = process.env.INDEXNOW_KEY ?? 'dbbe838b8e1f70c404026cef8b3ec027'
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`
const SITEMAP_URL = `https://${HOST}/sitemap.xml`
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'
const DRY_RUN = process.argv.includes('--dry-run')

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'splitvote-indexnow/1.0' } })
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`)
  return res.text()
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].trim())
}

async function collectUrls() {
  const xml = await fetchText(SITEMAP_URL)
  let locs = extractLocs(xml)
  // If the sitemap is an index (<sitemapindex>), the locs point at child sitemaps.
  if (/<sitemapindex/i.test(xml)) {
    const children = locs
    locs = []
    for (const child of children) {
      try {
        locs.push(...extractLocs(await fetchText(child)))
      } catch (e) {
        console.warn(`  ! skipped child sitemap ${child}: ${e.message}`)
      }
    }
  }
  // Dedup + same-host guard (IndexNow rejects mixed hosts).
  return [...new Set(locs)].filter((u) => {
    try {
      return new URL(u).host === HOST
    } catch {
      return false
    }
  })
}

async function verifyKeyLive() {
  try {
    const body = (await fetchText(KEY_LOCATION)).trim()
    if (body !== KEY) {
      throw new Error(`key file content "${body}" != expected key`)
    }
    return true
  } catch (e) {
    return e.message
  }
}

async function main() {
  console.log(`IndexNow submit — host=${HOST} key=${KEY.slice(0, 6)}…`)

  const urls = await collectUrls()
  console.log(`Collected ${urls.length} URLs from ${SITEMAP_URL}`)

  if (DRY_RUN) {
    urls.forEach((u) => console.log(`  ${u}`))
    console.log('\n[dry-run] nothing submitted.')
    return
  }

  const keyCheck = await verifyKeyLive()
  if (keyCheck !== true) {
    console.error(`\nABORT: key file not verifiable at ${KEY_LOCATION}\n  ${keyCheck}`)
    console.error('Deploy the key file to production first (it ships in public/), then re-run.')
    process.exit(1)
  }

  if (urls.length === 0) {
    console.error('ABORT: no URLs collected — refusing to submit an empty list.')
    process.exit(1)
  }

  // IndexNow accepts up to 10,000 URLs per request; we are well under.
  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls }),
  })

  // IndexNow returns 200 (accepted) or 202 (accepted, pending). 4xx = problem.
  console.log(`IndexNow -> ${res.status} ${res.statusText}`)
  if (res.status !== 200 && res.status !== 202) {
    const txt = await res.text().catch(() => '')
    console.error(`Submission rejected.\n${txt}`)
    process.exit(1)
  }
  console.log(`Submitted ${urls.length} URLs to IndexNow.`)
}

main().catch((e) => {
  console.error(`FATAL: ${e.message}`)
  process.exit(1)
})
