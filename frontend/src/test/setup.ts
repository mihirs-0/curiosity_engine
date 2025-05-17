import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { vi } from 'vitest'

// Extend Vitest's expect with testing-library matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock environment variables
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (_table: string) => ({
      select: () => ({
        data: [],
        error: null
      }),
      insert: (data: Record<string, unknown>) => ({
        data: [data],
        error: null
      })
    })
  }
})) 