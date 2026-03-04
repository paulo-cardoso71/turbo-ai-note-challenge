export interface Category {
  id: number
  name: string
  color: string
}

export interface Note {
  id: string
  title: string
  content: string
  category: number | null
  category_detail: Category | null
  created_at: string
  updated_at: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface User {
  email: string
  tokens: AuthTokens
}