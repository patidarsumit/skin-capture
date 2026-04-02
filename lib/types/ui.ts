export type ToastState = {
  open: boolean
  tone: "neutral" | "success" | "error"
  title: string
  message: string
}
