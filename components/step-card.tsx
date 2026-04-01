type StepCardProps = {
  step: string
  title: string
  description: string
}

export function StepCard({ step, title, description }: StepCardProps) {
  return (
    <article className="soft-shadow rounded-[28px] border border-border bg-card p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{step}</p>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
    </article>
  )
}
