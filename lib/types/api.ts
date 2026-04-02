export type EnhanceResponse = {
  imageDataUrl?: string
  error?: string
}

export type SubmitResponse = {
  message?: string
  error?: string
  submission?: {
    id: number
    originalPath: string
    enhancedPath: string
  }
}
