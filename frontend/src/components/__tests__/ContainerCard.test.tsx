import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ContainerCard } from '../dashboard/ContainerCard'

const mockContainer = {
  id: 'test-container-id',
  name: 'test-container',
  image: 'nginx:alpine',
  status: 'running',
  state: 'running',
  created: '2025-10-15T16:00:00Z',
  ports: [
    {
      private_port: 80,
      public_port: 8080,
      type: 'tcp',
      ip: '0.0.0.0'
    }
  ],
  labels: {
    'com.docker.compose.project': 'test'
  },
  environment: {
    'NGINX_HOST': 'localhost'
  },
  cpu_usage: 0.5,
  memory_usage: 52428800
}

const mockHandlers = {
  onStart: jest.fn(),
  onStop: jest.fn(),
  onRemove: jest.fn(),
}

describe('ContainerCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders container information', () => {
    render(<ContainerCard container={mockContainer} {...mockHandlers} />)
    
    expect(screen.getByText('test-container')).toBeInTheDocument()
    expect(screen.getByText('nginx:alpine')).toBeInTheDocument()
    expect(screen.getByText('running')).toBeInTheDocument()
  })

  it('displays container ports', () => {
    render(<ContainerCard container={mockContainer} {...mockHandlers} />)
    
    expect(screen.getByText('8080:80')).toBeInTheDocument()
  })

  it('shows container menu on click', () => {
    render(<ContainerCard container={mockContainer} {...mockHandlers} />)
    
    const menuButton = screen.getByRole('button', { name: /menu/i })
    fireEvent.click(menuButton)
    
    expect(screen.getByText('Start')).toBeInTheDocument()
    expect(screen.getByText('Stop')).toBeInTheDocument()
    expect(screen.getByText('Remove')).toBeInTheDocument()
  })

  it('calls onStart when start button is clicked', () => {
    render(<ContainerCard container={mockContainer} {...mockHandlers} />)
    
    const menuButton = screen.getByRole('button', { name: /menu/i })
    fireEvent.click(menuButton)
    
    const startButton = screen.getByText('Start')
    fireEvent.click(startButton)
    
    expect(mockHandlers.onStart).toHaveBeenCalledWith('test-container-id')
  })

  it('calls onStop when stop button is clicked', () => {
    render(<ContainerCard container={mockContainer} {...mockHandlers} />)
    
    const menuButton = screen.getByRole('button', { name: /menu/i })
    fireEvent.click(menuButton)
    
    const stopButton = screen.getByText('Stop')
    fireEvent.click(stopButton)
    
    expect(mockHandlers.onStop).toHaveBeenCalledWith('test-container-id')
  })

  it('calls onRemove when remove button is clicked', () => {
    render(<ContainerCard container={mockContainer} {...mockHandlers} />)
    
    const menuButton = screen.getByRole('button', { name: /menu/i })
    fireEvent.click(menuButton)
    
    const removeButton = screen.getByText('Remove')
    fireEvent.click(removeButton)
    
    expect(mockHandlers.onRemove).toHaveBeenCalledWith('test-container-id')
  })
})
