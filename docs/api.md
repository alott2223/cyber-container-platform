# 🔌 API Reference

This document provides comprehensive documentation for the Cyber Container Platform REST API.

## 🌐 Base URL

```
http://localhost:8080/api/v1
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Login

**POST** `/auth/login`

Request body:
```json
{
  "username": "admin",
  "password": "admin"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "admin"
  }
}
```

### Register

**POST** `/auth/register`

Request body:
```json
{
  "username": "newuser",
  "password": "securepassword"
}
```

Response:
```json
{
  "message": "User registered successfully"
}
```

### Logout

**POST** `/auth/logout`

Response:
```json
{
  "message": "Logged out successfully"
}
```

## 🐳 Containers

### List Containers

**GET** `/containers`

Response:
```json
{
  "containers": [
    {
      "id": "93b3b478f5a4",
      "name": "nginx-web",
      "image": "nginx:alpine",
      "status": "running",
      "state": "running",
      "created": "2025-10-15T16:13:00Z",
      "ports": [
        {
          "private_port": 80,
          "public_port": 8082,
          "type": "tcp",
          "ip": "0.0.0.0"
        }
      ],
      "labels": {
        "com.docker.compose.project": "cyber-platform"
      },
      "environment": {
        "NGINX_HOST": "localhost"
      },
      "cpu_usage": 0.5,
      "memory_usage": 52428800
    }
  ]
}
```

### Get Container

**GET** `/containers/{id}`

Response:
```json
{
  "container": {
    "id": "93b3b478f5a4",
    "name": "nginx-web",
    "image": "nginx:alpine",
    "status": "running",
    "state": "running",
    "created": "2025-10-15T16:13:00Z",
    "ports": [
      {
        "private_port": 80,
        "public_port": 8082,
        "type": "tcp",
        "ip": "0.0.0.0"
      }
    ],
    "labels": {
      "com.docker.compose.project": "cyber-platform"
    },
    "environment": {
      "NGINX_HOST": "localhost"
    },
    "cpu_usage": 0.5,
    "memory_usage": 52428800
  }
}
```

### Create Container

**POST** `/containers`

Request body:
```json
{
  "name": "my-container",
  "image": "nginx:alpine",
  "ports": {
    "8080": "80"
  },
  "environment": {
    "NGINX_HOST": "localhost"
  },
  "volumes": {
    "/host/path": "/container/path"
  },
  "network": "bridge"
}
```

Response:
```json
{
  "container": {
    "id": "a1b2c3d4e5f6",
    "name": "my-container",
    "image": "nginx:alpine",
    "status": "created",
    "state": "created",
    "created": "2025-10-15T16:20:00Z"
  },
  "message": "Container created successfully"
}
```

### Start Container

**POST** `/containers/{id}/start`

Response:
```json
{
  "message": "Container started successfully"
}
```

### Stop Container

**POST** `/containers/{id}/stop`

Response:
```json
{
  "message": "Container stopped successfully"
}
```

### Remove Container

**DELETE** `/containers/{id}`

Response:
```json
{
  "message": "Container removed successfully"
}
```

### Get Container Logs

**GET** `/containers/{id}/logs`

Query parameters:
- `follow` (boolean): Stream logs in real-time
- `tail` (integer): Number of lines to show from the end

Response:
```
2025/10/15 16:20:00 [notice] 1#1: start worker processes
2025/10/15 16:20:00 [notice] 1#1: start worker process 1234
```

### Get Container Stats

**GET** `/containers/{id}/stats`

Response:
```json
{
  "stats": {
    "cpu_usage": 0.5,
    "memory_usage": 52428800,
    "memory_limit": 1073741824,
    "network_rx": 1024,
    "network_tx": 2048,
    "block_read": 512,
    "block_write": 1024
  }
}
```

## 🌐 Networks

### List Networks

**GET** `/networks`

Response:
```json
{
  "networks": [
    {
      "id": "1fd71c12db2e",
      "name": "bridge",
      "driver": "bridge",
      "scope": "local",
      "created": "2025-10-15T16:00:00Z",
      "containers": [
        {
          "id": "93b3b478f5a4",
          "name": "nginx-web",
          "ip": "172.17.0.2"
        }
      ]
    }
  ]
}
```

### Get Network

**GET** `/networks/{id}`

Response:
```json
{
  "network": {
    "id": "1fd71c12db2e",
    "name": "bridge",
    "driver": "bridge",
    "scope": "local",
    "created": "2025-10-15T16:00:00Z",
    "containers": [
      {
        "id": "93b3b478f5a4",
        "name": "nginx-web",
        "ip": "172.17.0.2"
      }
    ]
  }
}
```

### Create Network

**POST** `/networks`

Request body:
```json
{
  "name": "my-network",
  "driver": "bridge",
  "options": {
    "com.docker.network.bridge.name": "my-bridge"
  }
}
```

Response:
```json
{
  "network": {
    "id": "a1b2c3d4e5f6",
    "name": "my-network",
    "driver": "bridge",
    "scope": "local",
    "created": "2025-10-15T16:25:00Z"
  },
  "message": "Network created successfully"
}
```

### Remove Network

**DELETE** `/networks/{id}`

Response:
```json
{
  "message": "Network removed successfully"
}
```

## 💾 Volumes

### List Volumes

**GET** `/volumes`

Response:
```json
{
  "volumes": [
    {
      "name": "my-volume",
      "driver": "local",
      "mountpoint": "/var/lib/docker/volumes/my-volume/_data",
      "created": "2025-10-15T16:00:00Z",
      "labels": {
        "com.docker.volume.anonymous": ""
      }
    }
  ]
}
```

### Get Volume

**GET** `/volumes/{name}`

Response:
```json
{
  "volume": {
    "name": "my-volume",
    "driver": "local",
    "mountpoint": "/var/lib/docker/volumes/my-volume/_data",
    "created": "2025-10-15T16:00:00Z",
    "labels": {
      "com.docker.volume.anonymous": ""
    }
  }
}
```

### Create Volume

**POST** `/volumes`

Request body:
```json
{
  "name": "my-volume",
  "driver": "local",
  "options": {
    "type": "none",
    "device": "/host/path",
    "o": "bind"
  }
}
```

Response:
```json
{
  "volume": {
    "name": "my-volume",
    "driver": "local",
    "mountpoint": "/var/lib/docker/volumes/my-volume/_data",
    "created": "2025-10-15T16:25:00Z"
  },
  "message": "Volume created successfully"
}
```

### Remove Volume

**DELETE** `/volumes/{name}`

Response:
```json
{
  "message": "Volume removed successfully"
}
```

## 📋 Templates

### List Templates

**GET** `/templates`

Response:
```json
{
  "templates": [
    {
      "id": 1,
      "name": "Nginx Web Server",
      "description": "A simple Nginx web server template",
      "image": "nginx:alpine",
      "config": {
        "ports": {
          "80": "80"
        },
        "environment": {
          "NGINX_HOST": "localhost"
        }
      },
      "created_at": "2025-10-15T16:00:00Z"
    }
  ]
}
```

### Get Template

**GET** `/templates/{id}`

Response:
```json
{
  "template": {
    "id": 1,
    "name": "Nginx Web Server",
    "description": "A simple Nginx web server template",
    "image": "nginx:alpine",
    "config": {
      "ports": {
        "80": "80"
      },
      "environment": {
        "NGINX_HOST": "localhost"
      }
    },
    "created_at": "2025-10-15T16:00:00Z"
  }
}
```

### Create Template

**POST** `/templates`

Request body:
```json
{
  "name": "My Template",
  "description": "A custom template",
  "image": "nginx:alpine",
  "config": {
    "ports": {
      "80": "80"
    },
    "environment": {
      "NGINX_HOST": "localhost"
    }
  }
}
```

Response:
```json
{
  "template": {
    "id": 2,
    "name": "My Template",
    "description": "A custom template",
    "image": "nginx:alpine",
    "config": {
      "ports": {
        "80": "80"
      },
      "environment": {
        "NGINX_HOST": "localhost"
      }
    },
    "created_at": "2025-10-15T16:25:00Z"
  },
  "message": "Template created successfully"
}
```

### Update Template

**PUT** `/templates/{id}`

Request body:
```json
{
  "name": "Updated Template",
  "description": "An updated template",
  "image": "nginx:alpine",
  "config": {
    "ports": {
      "80": "80"
    },
    "environment": {
      "NGINX_HOST": "localhost"
    }
  }
}
```

Response:
```json
{
  "template": {
    "id": 2,
    "name": "Updated Template",
    "description": "An updated template",
    "image": "nginx:alpine",
    "config": {
      "ports": {
        "80": "80"
      },
      "environment": {
        "NGINX_HOST": "localhost"
      }
    },
    "created_at": "2025-10-15T16:25:00Z"
  },
  "message": "Template updated successfully"
}
```

### Delete Template

**DELETE** `/templates/{id}`

Response:
```json
{
  "message": "Template deleted successfully"
}
```

## 🔌 WebSocket API

### Connection

Connect to WebSocket endpoint:
```
ws://localhost:8081/ws
```

### Events

#### Container Events

```json
{
  "type": "container_event",
  "event": "start",
  "container": {
    "id": "93b3b478f5a4",
    "name": "nginx-web",
    "status": "running"
  }
}
```

#### System Events

```json
{
  "type": "system_event",
  "event": "health_check",
  "data": {
    "status": "healthy",
    "timestamp": 1697123456
  }
}
```

#### Metrics Events

```json
{
  "type": "metrics_event",
  "event": "container_stats",
  "data": {
    "container_id": "93b3b478f5a4",
    "cpu_usage": 0.5,
    "memory_usage": 52428800
  }
}
```

## 📊 Health Check

### Health Status

**GET** `/health`

Response:
```json
{
  "status": "healthy",
  "timestamp": 1697123456,
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "docker": "healthy",
    "websocket": "healthy"
  }
}
```

## 🚨 Error Responses

### Standard Error Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

### Common Error Codes

- `INVALID_REQUEST` - Invalid request format
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Access denied
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict
- `INTERNAL_ERROR` - Internal server error

### HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## 🔒 Rate Limiting

The API implements rate limiting to prevent abuse:

- **General API**: 100 requests per minute
- **Authentication**: 5 requests per minute
- **Container operations**: 20 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1697123456
```

## 📝 Examples

### Complete Container Lifecycle

```bash
# 1. Create container
curl -X POST http://localhost:8080/api/v1/containers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-app",
    "image": "nginx:alpine",
    "ports": {"8080": "80"}
  }'

# 2. Start container
curl -X POST http://localhost:8080/api/v1/containers/my-app/start \
  -H "Authorization: Bearer <token>"

# 3. Get container logs
curl http://localhost:8080/api/v1/containers/my-app/logs \
  -H "Authorization: Bearer <token>"

# 4. Stop container
curl -X POST http://localhost:8080/api/v1/containers/my-app/stop \
  -H "Authorization: Bearer <token>"

# 5. Remove container
curl -X DELETE http://localhost:8080/api/v1/containers/my-app \
  -H "Authorization: Bearer <token>"
```

### WebSocket Client Example

```javascript
const ws = new WebSocket('ws://localhost:8081/ws');

ws.onopen = function() {
  console.log('Connected to WebSocket');
};

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
  
  switch(data.type) {
    case 'container_event':
      handleContainerEvent(data);
      break;
    case 'system_event':
      handleSystemEvent(data);
      break;
    case 'metrics_event':
      handleMetricsEvent(data);
      break;
  }
};

ws.onclose = function() {
  console.log('WebSocket connection closed');
};

function handleContainerEvent(data) {
  console.log(`Container ${data.container.name} ${data.event}`);
}

function handleSystemEvent(data) {
  console.log(`System event: ${data.event}`);
}

function handleMetricsEvent(data) {
  console.log(`Metrics for ${data.data.container_id}:`, data.data);
}
```

## 🔧 SDK Examples

### JavaScript/TypeScript

```typescript
class CyberPlatformClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getContainers() {
    return this.request('/containers');
  }

  async createContainer(config: any) {
    return this.request('/containers', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async startContainer(id: string) {
    return this.request(`/containers/${id}/start`, {
      method: 'POST',
    });
  }
}

// Usage
const client = new CyberPlatformClient('http://localhost:8080/api/v1', 'your-token');
const containers = await client.getContainers();
```

### Python

```python
import requests
import json

class CyberPlatformClient:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def request(self, endpoint, method='GET', data=None):
        url = f"{self.base_url}{endpoint}"
        response = requests.request(method, url, headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()

    def get_containers(self):
        return self.request('/containers')

    def create_container(self, config):
        return self.request('/containers', 'POST', config)

    def start_container(self, container_id):
        return self.request(f'/containers/{container_id}/start', 'POST')

# Usage
client = CyberPlatformClient('http://localhost:8080/api/v1', 'your-token')
containers = client.get_containers()
```

---

**Next Steps**: Check out our [Security Guide](./security.md) for security best practices.
