import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import QueriesList from './QueriesList'

// Mock the Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        data: [
          {
            id: 1,
            raw_query: 'Test query',
            answer_markdown: 'Test answer',
            created_at: new Date().toISOString()
          }
        ],
        error: null
      })
    })
  }
}))

describe('QueriesList', () => {
  it('renders queries', async () => {
    render(<QueriesList />)
    expect(await screen.findByText('Test query')).toBeInTheDocument()
  })
}) 