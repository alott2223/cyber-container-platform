package docker

import (
	"context"
	"fmt"
	"io"
	"net"
	"strings"

	"github.com/docker/docker/api/types"
)

// InteractiveExecSession provides a TTY-attached shell inside a container
type InteractiveExecSession struct {
	Conn   net.Conn
	Reader io.Reader
	ExecID string
	client *Client
}

// AttachInteractiveShell opens an interactive shell session with TTY
func (c *Client) AttachInteractiveShell(ctx context.Context, containerID string) (*InteractiveExecSession, error) {
	shell := detectShell(ctx, c, containerID)

	execConfig := types.ExecConfig{
		AttachStdin:  true,
		AttachStdout: true,
		AttachStderr: true,
		Tty:          true,
		Cmd:          []string{shell},
		Env:          []string{"TERM=xterm-256color"},
	}

	execResp, err := c.cli.ContainerExecCreate(ctx, containerID, execConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create exec: %w", err)
	}

	hijacked, err := c.cli.ContainerExecAttach(ctx, execResp.ID, types.ExecStartCheck{Tty: true})
	if err != nil {
		return nil, fmt.Errorf("failed to attach exec: %w", err)
	}

	return &InteractiveExecSession{
		Conn:   hijacked.Conn,
		Reader: hijacked.Reader,
		ExecID: execResp.ID,
		client: c,
	}, nil
}

// Resize updates the pseudo-TTY dimensions
func (s *InteractiveExecSession) Resize(cols, rows uint) error {
	return s.client.cli.ContainerExecResize(context.Background(), s.ExecID, types.ResizeOptions{
		Width:  cols,
		Height: rows,
	})
}

// Close terminates the exec session
func (s *InteractiveExecSession) Close() error {
	if s.Conn != nil {
		return s.Conn.Close()
	}
	return nil
}

func detectShell(ctx context.Context, c *Client, containerID string) string {
	info, err := c.cli.ContainerInspect(ctx, containerID)
	if err == nil {
		img := strings.ToLower(info.Config.Image)
		if strings.Contains(img, "ubuntu") || strings.Contains(img, "debian") || strings.Contains(img, "fedora") || strings.Contains(img, "kali") {
			return "/bin/bash"
		}
	}
	return "/bin/sh"
}

// GetContainerImage returns the image name for a container
func (c *Client) GetContainerImage(ctx context.Context, containerID string) (string, error) {
	info, err := c.cli.ContainerInspect(ctx, containerID)
	if err != nil {
		return "", err
	}
	if info.Config.Image != "" {
		return info.Config.Image, nil
	}
	return info.Image, nil
}
