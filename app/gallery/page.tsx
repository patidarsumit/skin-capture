import { GalleryPageClient } from "@/components/gallery-page-client"
import { getSubmissionFilters, listSubmissions } from "@/lib/submissions"

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const filters = getSubmissionFilters(resolvedSearchParams)
  const submissions = await listSubmissions(filters)

  return <GalleryPageClient initialSubmissions={submissions} initialFilters={filters} />
}
