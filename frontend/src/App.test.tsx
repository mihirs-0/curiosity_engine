import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from './App'
import { supabaseMock } from './lib/supabase'

// Mock the supabase import
vi.mock('./lib/supabase', () => ({
  supabase: supabaseMock
}))

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
}) 