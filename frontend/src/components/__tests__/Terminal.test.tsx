import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Terminal } from '../dashboard/Terminal'

jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

describe('Terminal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders terminal interface', async () => {
    render(<Terminal />)

    expect(screen.getByText('Terminal')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter command...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument()
      expect(screen.getByText('Cyber Container Platform Terminal')).toBeInTheDocument()
    })
  })

  it('displays help command output', async () => {
    render(<Terminal />)

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Enter command...')
    fireEvent.change(input, { target: { value: 'help' } })
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })

    await waitFor(() => {
      expect(screen.getAllByText(/Available commands:/).length).toBeGreaterThan(0)
    })
  })

  it('clears terminal on clear command', async () => {
    render(<Terminal />)

    await waitFor(() => {
      expect(screen.getByText('Connected to Docker Engine')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Enter command...')
    fireEvent.change(input, { target: { value: 'clear' } })
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })

    await waitFor(() => {
      expect(screen.queryByText('Connected to Docker Engine')).not.toBeInTheDocument()
    })
  })

  it('displays error for unknown commands', async () => {
    render(<Terminal />)

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Enter command...')
    fireEvent.change(input, { target: { value: 'unknown-command' } })
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })

    await waitFor(() => {
      expect(screen.getByText(/Command not found/)).toBeInTheDocument()
    })
  })

  it('renders quick command buttons', () => {
    render(<Terminal />)

    expect(screen.getByText('docker ps')).toBeInTheDocument()
    expect(screen.getByText('docker images')).toBeInTheDocument()
    expect(screen.getByText('docker network ls')).toBeInTheDocument()
    expect(screen.getByText('help')).toBeInTheDocument()
  })
})
