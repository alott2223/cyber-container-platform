import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Terminal } from '../dashboard/Terminal'

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
  },
}))

describe('Terminal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders terminal interface', () => {
    render(<Terminal />)
    
    expect(screen.getByText('Cyber Container Platform Terminal')).toBeInTheDocument()
    expect(screen.getByText('Connected to Docker Engine')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter command...')).toBeInTheDocument()
  })

  it('displays help command output', async () => {
    render(<Terminal />)
    
    const input = screen.getByPlaceholderText('Enter command...')
    fireEvent.change(input, { target: { value: 'help' } })
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' })
    
    await waitFor(() => {
      expect(screen.getByText(/Available commands:/)).toBeInTheDocument()
    })
  })

  it('clears terminal on clear command', async () => {
    render(<Terminal />)
    
    const input = screen.getByPlaceholderText('Enter command...')
    fireEvent.change(input, { target: { value: 'clear' } })
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' })
    
    await waitFor(() => {
      expect(screen.queryByText('Cyber Container Platform Terminal')).not.toBeInTheDocument()
    })
  })

  it('displays error for unknown commands', async () => {
    render(<Terminal />)
    
    const input = screen.getByPlaceholderText('Enter command...')
    fireEvent.change(input, { target: { value: 'unknown-command' } })
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' })
    
    await waitFor(() => {
      expect(screen.getByText(/Command not found/)).toBeInTheDocument()
    })
  })

  it('renders quick command buttons', () => {
    render(<Terminal />)
    
    expect(screen.getByText('docker ps')).toBeInTheDocument()
    expect(screen.getByText('docker images')).toBeInTheDocument()
    expect(screen.getByText('docker stats')).toBeInTheDocument()
    expect(screen.getByText('docker network ls')).toBeInTheDocument()
  })
})
