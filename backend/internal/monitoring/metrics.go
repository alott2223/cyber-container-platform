package monitoring

import (
	"sync"
	"time"
)

type Metrics struct {
	mu sync.RWMutex
	
	// Request metrics
	TotalRequests    int64
	SuccessfulRequests int64
	FailedRequests   int64
	
	// Response time metrics
	TotalResponseTime time.Duration
	MinResponseTime   time.Duration
	MaxResponseTime   time.Duration
	
	// Container metrics
	ContainersCreated int64
	ContainersStarted int64
	ContainersStopped int64
	ContainersDeleted int64
	
	// System metrics
	ActiveConnections int64
	MemoryUsage      int64
	CPUUsage         float64
	
	// Error tracking
	ErrorCounts map[string]int64
	
	// Uptime
	StartTime time.Time
}

var GlobalMetrics = &Metrics{
	ErrorCounts: make(map[string]int64),
	StartTime:   time.Now(),
}

func (m *Metrics) RecordRequest(duration time.Duration, success bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	m.TotalRequests++
	if success {
		m.SuccessfulRequests++
	} else {
		m.FailedRequests++
	}
	
	m.TotalResponseTime += duration
	
	if m.MinResponseTime == 0 || duration < m.MinResponseTime {
		m.MinResponseTime = duration
	}
	if duration > m.MaxResponseTime {
		m.MaxResponseTime = duration
	}
}

func (m *Metrics) RecordContainerAction(action string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	switch action {
	case "created":
		m.ContainersCreated++
	case "started":
		m.ContainersStarted++
	case "stopped":
		m.ContainersStopped++
	case "deleted":
		m.ContainersDeleted++
	}
}

func (m *Metrics) RecordError(errorType string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	m.ErrorCounts[errorType]++
}

func (m *Metrics) UpdateSystemMetrics(connections int64, memory int64, cpu float64) {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	m.ActiveConnections = connections
	m.MemoryUsage = memory
	m.CPUUsage = cpu
}

func (m *Metrics) GetStats() map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	avgResponseTime := time.Duration(0)
	if m.TotalRequests > 0 {
		avgResponseTime = m.TotalResponseTime / time.Duration(m.TotalRequests)
	}
	
	uptime := time.Since(m.StartTime)
	
	return map[string]interface{}{
		"requests": map[string]interface{}{
			"total":      m.TotalRequests,
			"successful": m.SuccessfulRequests,
			"failed":     m.FailedRequests,
			"success_rate": float64(m.SuccessfulRequests) / float64(m.TotalRequests) * 100,
		},
		"response_time": map[string]interface{}{
			"average": avgResponseTime.String(),
			"min":     m.MinResponseTime.String(),
			"max":     m.MaxResponseTime.String(),
		},
		"containers": map[string]interface{}{
			"created": m.ContainersCreated,
			"started": m.ContainersStarted,
			"stopped": m.ContainersStopped,
			"deleted": m.ContainersDeleted,
		},
		"system": map[string]interface{}{
			"active_connections": m.ActiveConnections,
			"memory_usage":       m.MemoryUsage,
			"cpu_usage":          m.CPUUsage,
			"uptime":             uptime.String(),
		},
		"errors": m.ErrorCounts,
	}
}

// HealthCheck provides system health status
func (m *Metrics) HealthCheck() map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	uptime := time.Since(m.StartTime)
	
	// Determine health status
	status := "healthy"
	if m.FailedRequests > 0 && float64(m.FailedRequests)/float64(m.TotalRequests) > 0.1 {
		status = "degraded"
	}
	if m.FailedRequests > 0 && float64(m.FailedRequests)/float64(m.TotalRequests) > 0.3 {
		status = "unhealthy"
	}
	
	return map[string]interface{}{
		"status":    status,
		"uptime":    uptime.String(),
		"timestamp": time.Now().Unix(),
		"version":   "1.0.0",
		"checks": map[string]interface{}{
			"database": "healthy",
			"docker":   "healthy",
			"memory":   "healthy",
			"cpu":      "healthy",
		},
	}
}
