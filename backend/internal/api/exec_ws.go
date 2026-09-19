package api

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"

	"cyber-container-platform/internal/docker"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

var execUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type wsResizeMessage struct {
	Type string `json:"type"`
	Cols uint   `json:"cols"`
	Rows uint   `json:"rows"`
}

func (s *Server) containerExecWS(c *gin.Context) {
	containerID := c.Param("id")
	if containerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Container ID required"})
		return
	}

	tokenString := c.Query("token")
	if tokenString == "" {
		authHeader := c.GetHeader("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	if tokenString == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization required"})
		return
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.config.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	wsConn, err := execUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}
	defer wsConn.Close()

	session, err := s.dockerClient.AttachInteractiveShell(c.Request.Context(), containerID)
	if err != nil {
		_ = wsConn.WriteMessage(websocket.TextMessage, []byte("\r\n\x1b[31mFailed to attach shell: "+docker.FriendlyError(err)+"\x1b[0m\r\n"))
		return
	}
	defer session.Close()

	image, _ := s.dockerClient.GetContainerImage(c.Request.Context(), containerID)
	welcome := buildWelcomeBanner(containerID, image)
	_ = wsConn.WriteMessage(websocket.TextMessage, []byte(welcome))

	done := make(chan struct{})

	go func() {
		buf := make([]byte, 4096)
		for {
			n, readErr := session.Reader.Read(buf)
			if n > 0 {
				if writeErr := wsConn.WriteMessage(websocket.TextMessage, buf[:n]); writeErr != nil {
					break
				}
			}
			if readErr != nil {
				if readErr != io.EOF {
					log.Printf("Exec read error: %v", readErr)
				}
				break
			}
		}
		close(done)
	}()

	for {
		select {
		case <-done:
			return
		default:
		}

		messageType, message, readErr := wsConn.ReadMessage()
		if readErr != nil {
			return
		}

		if messageType == websocket.TextMessage || messageType == websocket.BinaryMessage {
			if len(message) > 0 && message[0] == '{' {
				var msg wsResizeMessage
				if json.Unmarshal(message, &msg) == nil && msg.Type == "resize" {
					_ = session.Resize(msg.Cols, msg.Rows)
					continue
				}
			}
			_, _ = session.Conn.Write(message)
		}
	}
}

func buildWelcomeBanner(containerID, image string) string {
	shortID := containerID
	if len(shortID) > 12 {
		shortID = shortID[:12]
	}

	banner := "\r\n\x1b[36m╔══════════════════════════════════════════════════╗\x1b[0m\r\n"
	banner += "\x1b[36m║\x1b[0m  \x1b[1mCYBER CONTAINER — Interactive Shell\x1b[0m            \x1b[36m║\x1b[0m\r\n"
	banner += "\x1b[36m╚══════════════════════════════════════════════════╝\x1b[0m\r\n"
	banner += "\x1b[90m Container: \x1b[0m" + shortID + "\r\n"
	banner += "\x1b[90m Image:     \x1b[0m" + image + "\r\n"

	if strings.Contains(strings.ToLower(image), "alpine") {
		banner += "\r\n\x1b[32m Alpine Linux detected\x1b[0m — try: \x1b[33mls\x1b[0m, \x1b[33mcat /etc/os-release\x1b[0m, \x1b[33m/opsec/scripts/opsec-baseline.sh\x1b[0m\r\n"
	}

	banner += "\r\n"
	return banner
}
