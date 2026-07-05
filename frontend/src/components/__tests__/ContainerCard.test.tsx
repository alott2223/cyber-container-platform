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
      ip: '0.0.0.0',
    },
  ],
  labels: {
    'com.docker.compose.project': 'test',
  },
  environment: {
    NGINX_HOST: 'localhost',
  },
  cpu_usage: 0.5,
  memory_usage: 52428800,
}

const mockHandlers = {
  onStart: jest.fn(),
  onStop: jest.fn(),
  onRemove: jest.fn(),
  onShell: jest.fn(),
  onOpenConsole: jest.fn(),
  isLoading: false,
}

describe('ContainerCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders container information', () => {
    render(<ContainerCard container={mockContainer} {...mockHandlers} />)

    expect(screen.getByText('test-container')).toBeInTheDocument()
    expect(screen.getByText('nginx:alpine')).toBeInTheDocument()
    expect(screen.getByText('Running')).toBeInTheDocument()
  })

  it('displays container ports', () => {
    render(<ContainerCard container={mockContainer} {...mockHandlers} />)

    expect(screen.getByText('8080:80')).toBeInTheDocument()
  })

  it('shows container menu on click', () => {
    render(<ContainerCard container={mockContainer} {...mockHandlers} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open container menu' }))

    expect(screen.getByText('Open Terminal')).toBeInTheDocument()
    expect(screen.getByText('View Logs')).toBeInTheDocument()
    expect(screen.getByText('Remove')).toBeInTheDocument()
  })

  it('calls onStop when stop button is clicked for running container', () => {
    render(<ContainerCard container={mockContainer} {...mockHandlers} />)

    fireEvent.click(screen.getByText('Stop'))

    expect(mockHandlers.onStop).toHaveBeenCalled()
  })

  it('calls onStart when start button is clicked for stopped container', () => {
    const stoppedContainer = { ...mockContainer, state: 'exited' }
    render(<ContainerCard container={stoppedContainer} {...mockHandlers} />)

    fireEvent.click(screen.getByText('Start'))

    expect(mockHandlers.onStart).toHaveBeenCalled()
  })

  it('calls onRemove from menu', () => {
    render(<ContainerCard container={mockContainer} {...mockHandlers} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open container menu' }))
    fireEvent.click(screen.getByText('Remove'))

    expect(mockHandlers.onRemove).toHaveBeenCalled()
  })
})
