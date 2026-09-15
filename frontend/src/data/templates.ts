export type ContainerTemplate = {
  id: string
  name: string
  category: 'os' | 'web' | 'database' | 'cache' | 'language' | 'utility'
  image: string
  description: string
  difficulty?: 'easy' | 'medium' | 'hard'
  icon?: string
  ports?: Record<string, string>
  environment?: Record<string, string>
  volumes?: string[]
  networks?: string[]
  documentation?: string
}

export const containerTemplates: ContainerTemplate[] = [
  {
    id: 'kali-linux',
    name: 'Kali Linux',
    category: 'os',
    image: 'kalilinux/kali-rolling:latest',
    description: 'Kali Linux rolling release environment for security testing and administration.',
    difficulty: 'easy',
    icon: 'K',
  },
  {
    id: 'nginx',
    name: 'Nginx',
    category: 'web',
    image: 'nginx:alpine',
    description: 'Lightweight web server and reverse proxy.',
    difficulty: 'easy',
    icon: 'N',
    ports: { '8082': '80' },
  },
  {
    id: 'redis',
    name: 'Redis',
    category: 'cache',
    image: 'redis:alpine',
    description: 'In-memory data store for caching and queues.',
    difficulty: 'easy',
    icon: 'R',
    ports: { '6379': '6379' },
  },
]

export function getTemplatesByCategory(category: ContainerTemplate['category']): ContainerTemplate[] {
  return containerTemplates.filter((template) => template.category === category)
}
