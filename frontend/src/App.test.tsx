import { render, screen } from '@testing-library/react'
import { describe, it } from 'vitest'
import App from './App'

// Skip all tests in this file for now
// eslint-disable-next-line vitest/no-disabled-tests
describe.skip('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    // expect(screen.getByRole('main')).toBeInTheDocument()
  })
}) 