export const skinTypes = [
  "Oily",
  "Dry",
  "Combination",
  "Normal",
  "Sensitive",
] as const

export const skinTones = [
  { value: "Fair", swatch: "#f5d7c6" },
  { value: "Light", swatch: "#e7bf9f" },
  { value: "Medium", swatch: "#c58f68" },
  { value: "Olive", swatch: "#ab815b" },
  { value: "Tan", swatch: "#8b5e3c" },
  { value: "Deep", swatch: "#5f3a26" },
] as const

export const skinConcerns = [
  "Acne",
  "Pigmentation",
  "Dryness",
  "Wrinkles",
  "Redness",
  "Dark Circles",
  "Texture",
  "Sensitivity",
] as const

export type SkinType = (typeof skinTypes)[number]
export type SkinTone = (typeof skinTones)[number]["value"]
export type SkinConcern = (typeof skinConcerns)[number]

export type SkinProfilePayload = {
  skinType: SkinType | ""
  skinTone: SkinTone | ""
  skinConcerns: SkinConcern[]
  additionalNotes: string
  consentAccepted: boolean
  annotationLabel: string
}

export const initialSkinProfile: SkinProfilePayload = {
  skinType: "",
  skinTone: "",
  skinConcerns: [],
  additionalNotes: "",
  consentAccepted: false,
  annotationLabel: "",
}
