package api

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

var streamUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func (s *Server) validateWSToken(c *gin.Context) bool {
	tokenString := c.Query("token")
	if tokenString == "" {
		authHeader := c.GetHeader("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}
	if tokenString == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization required"})
		return false
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.config.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return false
	}
	return true
}

func (s *Server) containerLogsWS(c *gin.Context) {
	containerID := c.Param("id")
	if containerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Container ID required"})
		return
	}
	if !s.validateWSToken(c) {
		return
	}

	wsConn, err := streamUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Logs WebSocket upgrade failed: %v", err)
		return
	}
	defer wsConn.Close()

	logs, err := s.dockerClient.GetContainerLogs(containerID)
	if err != nil {
		_ = wsConn.WriteMessage(websocket.TextMessage, []byte("Failed to stream logs: "+err.Error()))
		return
	}
	defer logs.Close()

	_ = wsConn.WriteMessage(websocket.TextMessage, []byte("--- Live container logs ---\n"))

	buf := make([]byte, 4096)
	for {
		n, readErr := logs.Read(buf)
		if n > 0 {
			if writeErr := wsConn.WriteMessage(websocket.TextMessage, buf[:n]); writeErr != nil {
				return
			}
		}
		if readErr != nil {
			if readErr != io.EOF {
				log.Printf("Logs stream error: %v", readErr)
			}
			return
		}
	}
}

func (s *Server) containerStatsWS(c *gin.Context) {
	containerID := c.Param("id")
	if containerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Container ID required"})
		return
	}
	if !s.validateWSToken(c) {
		return
	}

	wsConn, err := streamUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Stats WebSocket upgrade failed: %v", err)
		return
	}
	defer wsConn.Close()

	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		stats, statsErr := s.dockerClient.GetContainerStats(containerID)
		if statsErr != nil {
			msg, _ := json.Marshal(gin.H{"error": statsErr.Error()})
			_ = wsConn.WriteMessage(websocket.TextMessage, msg)
			return
		}

		body, readErr := io.ReadAll(stats.Body)
		stats.Body.Close()
		if readErr != nil {
			return
		}

		if writeErr := wsConn.WriteMessage(websocket.TextMessage, body); writeErr != nil {
			return
		}

		select {
		case <-ticker.C:
		}
	}
}
