// Reusable JSON-LD injection component (server component safe)
interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[]
}

// Escapes </script> closing tags so they can't break out of the script block.
// JSON.stringify does NOT escape < or > by default.
function safeJsonStringify(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonStringify(data) }}
    />
  )
}
