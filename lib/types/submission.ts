export type Submission = {
  id: number
  originalFilename: string
  originalPath: string
  enhancedPath: string
  skinType: string
  skinTone: string
  skinConcerns: string[]
  additionalNotes: string | null
  annotationLabel: string | null
  consentAccepted: boolean
  createdAt: string
}

export type SubmissionFilters = {
  skinType: string
  skinTone: string
  concern: string
  search: string
  dateFrom: string
  dateTo: string
  sortBy: string
}
