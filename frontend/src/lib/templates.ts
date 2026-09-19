export type TemplateCategory =
  | 'os'
  | 'web'
  | 'database'
  | 'cache'
  | 'language'
  | 'utility'

export interface ContainerTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  image: string
  icon?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  ports?: Record<string, string>
  environment?: Record<string, string>
  volumes?: string[]
  networks?: string[]
  documentation?: string
}

export const containerTemplates: ContainerTemplate[] = [
  {
    id: 'nginx',
    name: 'Nginx',
    description: 'High-performance web server and reverse proxy.',
    category: 'web',
    image: 'nginx:alpine',
    icon: '🌐',
    difficulty: 'easy',
    ports: { '8080': '80' },
    documentation: 'https://nginx.org/en/docs/',
  },
  {
    id: 'redis',
    name: 'Redis',
    description: 'In-memory data store for caching and messaging.',
    category: 'cache',
    image: 'redis:7-alpine',
    icon: '⚡',
    difficulty: 'easy',
    ports: { '6379': '6379' },
    documentation: 'https://redis.io/docs/',
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Relational database for production workloads.',
    category: 'database',
    image: 'postgres:16-alpine',
    icon: '🐘',
    difficulty: 'medium',
    ports: { '5432': '5432' },
    environment: {
      POSTGRES_USER: 'cyber',
      POSTGRES_PASSWORD: 'change-me-in-production',
      POSTGRES_DB: 'cyberdb',
    },
    volumes: ['postgres-data:/var/lib/postgresql/data'],
    documentation: 'https://www.postgresql.org/docs/',
  },
  {
    id: 'mysql',
    name: 'MySQL',
    description: 'Popular open-source relational database.',
    category: 'database',
    image: 'mysql:8',
    icon: '🐬',
    difficulty: 'medium',
    ports: { '3306': '3306' },
    environment: {
      MYSQL_ROOT_PASSWORD: 'change-me-in-production',
      MYSQL_DATABASE: 'cyberdb',
    },
    volumes: ['mysql-data:/var/lib/mysql'],
    documentation: 'https://dev.mysql.com/doc/',
  },
  {
    id: 'node',
    name: 'Node.js',
    description: 'JavaScript runtime for API and web applications.',
    category: 'language',
    image: 'node:20-alpine',
    icon: '🟢',
    difficulty: 'easy',
    ports: { '3000': '3000' },
    environment: {
      NODE_ENV: 'production',
    },
    documentation: 'https://nodejs.org/docs/',
  },
  {
    id: 'python',
    name: 'Python',
    description: 'Python runtime for scripts and services.',
    category: 'language',
    image: 'python:3.12-slim',
    icon: '🐍',
    difficulty: 'easy',
    documentation: 'https://docs.python.org/3/',
  },
  {
    id: 'ubuntu',
    name: 'Ubuntu',
    description: 'General-purpose Linux environment for development.',
    category: 'os',
    image: 'ubuntu:24.04',
    icon: '🐧',
    difficulty: 'easy',
    documentation: 'https://ubuntu.com/server/docs',
  },
  {
    id: 'alpine',
    name: 'Alpine Linux',
    description: 'Minimal Linux image for lightweight containers.',
    category: 'os',
    image: 'alpine:3.20',
    icon: '🏔️',
    difficulty: 'easy',
    documentation: 'https://wiki.alpinelinux.org/',
  },
  {
    id: 'portainer-agent',
    name: 'Watchtower',
    description: 'Automatically update running containers to latest images.',
    category: 'utility',
    image: 'containrrr/watchtower',
    icon: '🔄',
    difficulty: 'medium',
    volumes: ['/var/run/docker.sock:/var/run/docker.sock'],
    documentation: 'https://containrrr.dev/watchtower/',
  },
  {
    id: 'mongo',
    name: 'MongoDB',
    description: 'Document database for flexible schema applications.',
    category: 'database',
    image: 'mongo:7',
    icon: '🍃',
    difficulty: 'medium',
    ports: { '27017': '27017' },
    environment: {
      MONGO_INITDB_ROOT_USERNAME: 'cyber',
      MONGO_INITDB_ROOT_PASSWORD: 'change-me-in-production',
    },
    volumes: ['mongo-data:/data/db'],
    documentation: 'https://www.mongodb.com/docs/',
  },
]

export function getTemplatesByCategory(category: TemplateCategory): ContainerTemplate[] {
  return containerTemplates.filter((template) => template.category === category)
}
