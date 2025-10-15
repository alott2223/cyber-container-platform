package docker

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/api/types/volume"
	"github.com/docker/docker/client"
)

type Client struct {
	cli *client.Client
}

type ContainerInfo struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Image       string            `json:"image"`
	Status      string            `json:"status"`
	State       string            `json:"state"`
	Created     time.Time         `json:"created"`
	Ports       []PortInfo        `json:"ports"`
	Labels      map[string]string `json:"labels"`
	Environment map[string]string `json:"environment"`
	CPUUsage    float64           `json:"cpu_usage"`
	MemoryUsage int64             `json:"memory_usage"`
}

type PortInfo struct {
	PrivatePort int    `json:"private_port"`
	PublicPort  int    `json:"public_port"`
	Type        string `json:"type"`
	IP          string `json:"ip"`
}

type NetworkInfo struct {
	ID       string            `json:"id"`
	Name     string            `json:"name"`
	Driver   string            `json:"driver"`
	Scope    string            `json:"scope"`
	Labels   map[string]string `json:"labels"`
	Containers map[string]NetworkContainer `json:"containers"`
}

type NetworkContainer struct {
	Name         string            `json:"name"`
	EndpointID   string            `json:"endpoint_id"`
	MacAddress   string            `json:"mac_address"`
	IPv4Address  string            `json:"ipv4_address"`
	IPv6Address  string            `json:"ipv6_address"`
}

type VolumeInfo struct {
	Name       string            `json:"name"`
	Driver     string            `json:"driver"`
	Mountpoint string            `json:"mountpoint"`
	Labels     map[string]string `json:"labels"`
	CreatedAt  time.Time         `json:"created_at"`
}

func NewClient() (*Client, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, fmt.Errorf("failed to create Docker client: %w", err)
	}

	return &Client{cli: cli}, nil
}

func (c *Client) ListContainers() ([]ContainerInfo, error) {
	containers, err := c.cli.ContainerList(context.Background(), container.ListOptions{
		All: true,
	})
	if err != nil {
		return nil, err
	}

	var result []ContainerInfo
	for _, cont := range containers {
		info := ContainerInfo{
			ID:      cont.ID,
			Name:    cont.Names[0][1:], // Remove leading slash
			Image:   cont.Image,
			Status:  cont.Status,
			State:   cont.State,
			Created: time.Unix(cont.Created, 0),
			Labels:  cont.Labels,
		}

		// Parse ports
		for _, port := range cont.Ports {
			info.Ports = append(info.Ports, PortInfo{
				PrivatePort: int(port.PrivatePort),
				PublicPort:  int(port.PublicPort),
				Type:        port.Type,
				IP:          port.IP,
			})
		}

		result = append(result, info)
	}

	return result, nil
}

func (c *Client) StartContainer(id string) error {
	return c.cli.ContainerStart(context.Background(), id, container.StartOptions{})
}

func (c *Client) StopContainer(id string) error {
	timeout := int(30)
	return c.cli.ContainerStop(context.Background(), id, container.StopOptions{
		Timeout: &timeout,
	})
}

func (c *Client) RemoveContainer(id string) error {
	return c.cli.ContainerRemove(context.Background(), id, container.RemoveOptions{
		Force: true,
	})
}

func (c *Client) CreateContainer(config *container.Config, hostConfig *container.HostConfig, networkingConfig *network.NetworkingConfig, name string) (string, error) {
	resp, err := c.cli.ContainerCreate(context.Background(), config, hostConfig, networkingConfig, nil, name)
	if err != nil {
		return "", err
	}
	return resp.ID, nil
}

func (c *Client) GetContainerLogs(id string) (io.ReadCloser, error) {
	return c.cli.ContainerLogs(context.Background(), id, container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Follow:     true,
		Timestamps: true,
	})
}

func (c *Client) ListNetworks() ([]NetworkInfo, error) {
	networks, err := c.cli.NetworkList(context.Background(), types.NetworkListOptions{})
	if err != nil {
		return nil, err
	}

	var result []NetworkInfo
	for _, net := range networks {
		info := NetworkInfo{
			ID:       net.ID,
			Name:     net.Name,
			Driver:   net.Driver,
			Scope:    net.Scope,
			Labels:   net.Labels,
			Containers: make(map[string]NetworkContainer),
		}

		for name, container := range net.Containers {
			info.Containers[name] = NetworkContainer{
				Name:         container.Name,
				EndpointID:   container.EndpointID,
				MacAddress:   container.MacAddress,
				IPv4Address:  container.IPv4Address,
				IPv6Address:  container.IPv6Address,
			}
		}

		result = append(result, info)
	}

	return result, nil
}

func (c *Client) CreateNetwork(name string, driver string) (string, error) {
	resp, err := c.cli.NetworkCreate(context.Background(), name, types.NetworkCreate{
		Driver: driver,
	})
	if err != nil {
		return "", err
	}
	return resp.ID, nil
}

func (c *Client) RemoveNetwork(id string) error {
	return c.cli.NetworkRemove(context.Background(), id)
}

func (c *Client) ListVolumes() ([]VolumeInfo, error) {
	volumes, err := c.cli.VolumeList(context.Background(), volume.ListOptions{})
	if err != nil {
		return nil, err
	}

	var result []VolumeInfo
	for _, vol := range volumes.Volumes {
		createdAt, _ := time.Parse(time.RFC3339, vol.CreatedAt)
		info := VolumeInfo{
			Name:       vol.Name,
			Driver:     vol.Driver,
			Mountpoint: vol.Mountpoint,
			Labels:     vol.Labels,
			CreatedAt:  createdAt,
		}
		result = append(result, info)
	}

	return result, nil
}

func (c *Client) CreateVolume(name string) (volume.Volume, error) {
	return c.cli.VolumeCreate(context.Background(), volume.CreateOptions{
		Name: name,
	})
}

func (c *Client) RemoveVolume(name string) error {
	return c.cli.VolumeRemove(context.Background(), name, false)
}

func (c *Client) GetContainerStats(id string) (types.ContainerStats, error) {
	return c.cli.ContainerStats(context.Background(), id, false)
}

func (c *Client) ListImages() ([]types.ImageSummary, error) {
	return c.cli.ImageList(context.Background(), types.ImageListOptions{})
}

// GetSystemInfo returns Docker system information
func (c *Client) GetSystemInfo() (types.Info, error) {
	return c.cli.Info(context.Background())
}
