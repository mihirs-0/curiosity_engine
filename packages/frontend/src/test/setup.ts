import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with testing-library matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Supabase client
const supabaseMock = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    insert: vi.fn((data: Record<string, unknown>) => ({
      data: [data],
      error: null
    }))
  }))
}

// Mock the supabase module
vi.mock('../lib/supabase', () => ({
  supabase: supabaseMock
})) 