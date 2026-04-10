import { prisma } from "@/lib/db"
import { skinConcerns, type SkinConcern } from "@/lib/skin-profile"

export type SubmissionSort = "newest" | "oldest" | "skinType" | "skinTone"

export type SubmissionQueryFilters = {
  skinType: string
  skinTone: string
  concern: string
  search: string
  dateFrom: string
  dateTo: string
  sortBy: SubmissionSort
}

export const defaultSubmissionFilters: SubmissionQueryFilters = {
  skinType: "all",
  skinTone: "all",
  concern: "all",
  search: "",
  dateFrom: "",
  dateTo: "",
  sortBy: "newest",
}

export function parseConcerns(input: string) {
  try {
    const parsed = JSON.parse(input)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((value): value is SkinConcern =>
      typeof value === "string" &&
      skinConcerns.includes(value as SkinConcern)
    )
  } catch {
    return []
  }
}

export function getSubmissionFilters(
  searchParams: Record<string, string | string[] | undefined>
): SubmissionQueryFilters {
  const sortBy = getSingleParam(searchParams.sortBy)

  return {
    skinType: getSingleParam(searchParams.skinType) || defaultSubmissionFilters.skinType,
    skinTone: getSingleParam(searchParams.skinTone) || defaultSubmissionFilters.skinTone,
    concern: getSingleParam(searchParams.concern) || defaultSubmissionFilters.concern,
    search: getSingleParam(searchParams.search) || defaultSubmissionFilters.search,
    dateFrom: getSingleParam(searchParams.dateFrom) || defaultSubmissionFilters.dateFrom,
    dateTo: getSingleParam(searchParams.dateTo) || defaultSubmissionFilters.dateTo,
    sortBy: isSubmissionSort(sortBy) ? sortBy : defaultSubmissionFilters.sortBy,
  }
}

export async function listSubmissions(filters: SubmissionQueryFilters) {
  const where: {
    skinType?: string
    skinTone?: string
    originalFilename?: { contains: string }
    createdAt?: { gte?: Date; lte?: Date }
    skinConcerns?: { contains: string }
  } = {}

  if (filters.skinType !== "all") where.skinType = filters.skinType
  if (filters.skinTone !== "all") where.skinTone = filters.skinTone
  if (filters.search) where.originalFilename = { contains: filters.search }
  if (filters.concern !== "all") where.skinConcerns = { contains: filters.concern }
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
  }

  const orderBy =
    filters.sortBy === "oldest"
      ? { createdAt: "asc" as const }
      : filters.sortBy === "skinType"
        ? [{ skinType: "asc" as const }, { createdAt: "desc" as const }]
        : filters.sortBy === "skinTone"
          ? [{ skinTone: "asc" as const }, { createdAt: "desc" as const }]
          : { createdAt: "desc" as const }

  const submissions = await prisma.skinSubmission.findMany({
    where,
    orderBy,
  })

  return submissions.map((submission) => ({
    ...submission,
    skinConcerns: parseConcerns(submission.skinConcerns),
    createdAt: submission.createdAt.toISOString(),
  }))
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function isSubmissionSort(value: string | undefined): value is SubmissionSort {
  return value === "newest" || value === "oldest" || value === "skinType" || value === "skinTone"
}
