import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import QueriesList from './QueriesList'
import { supabaseMock } from '../lib/supabase'

// Mock the supabase import
vi.mock('../lib/supabase', () => ({
  supabase: supabaseMock
}))

describe('QueriesList', () => {
  it('renders loading state initially', () => {
    render(<QueriesList />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders queries after loading', async () => {
    const mockQueries = [
      {
        id: 1,
        user_input: 'Test query 1',
        answer_markdown: 'Test answer 1',
        created_at: '2024-02-20T00:00:00Z'
      },
      {
        id: 2,
        user_input: 'Test query 2',
        answer_markdown: 'Test answer 2',
        created_at: '2024-02-20T00:00:00Z'
      }
    ]

    // Mock the Supabase response
    vi.mocked(supabaseMock.from).mockReturnValue({
      select: () => ({
        order: () => Promise.resolve({ data: mockQueries, error: null })
      })
    } as unknown as ReturnType<typeof supabaseMock.from>)

    render(<QueriesList />)

    await waitFor(() => {
      expect(screen.getByText('Test query 1')).toBeInTheDocument()
      expect(screen.getByText('Test query 2')).toBeInTheDocument()
    })
  })
}) 