package errors

import (
	"fmt"
	"net/http"
	"time"
)

// ErrorCode represents different types of errors
type ErrorCode string

const (
	// System errors
	ErrInternalServer     ErrorCode = "INTERNAL_SERVER_ERROR"
	ErrServiceUnavailable ErrorCode = "SERVICE_UNAVAILABLE"
	ErrTimeout           ErrorCode = "TIMEOUT"
	
	// Authentication errors
	ErrUnauthorized      ErrorCode = "UNAUTHORIZED"
	ErrForbidden         ErrorCode = "FORBIDDEN"
	ErrInvalidToken      ErrorCode = "INVALID_TOKEN"
	ErrTokenExpired      ErrorCode = "TOKEN_EXPIRED"
	
	// Validation errors
	ErrInvalidInput      ErrorCode = "INVALID_INPUT"
	ErrMissingField      ErrorCode = "MISSING_FIELD"
	ErrInvalidFormat     ErrorCode = "INVALID_FORMAT"
	
	// Docker errors
	ErrDockerUnavailable ErrorCode = "DOCKER_UNAVAILABLE"
	ErrContainerNotFound ErrorCode = "CONTAINER_NOT_FOUND"
	ErrImageNotFound     ErrorCode = "IMAGE_NOT_FOUND"
	ErrNetworkNotFound   ErrorCode = "NETWORK_NOT_FOUND"
	ErrVolumeNotFound    ErrorCode = "VOLUME_NOT_FOUND"
	
	// Rate limiting
	ErrRateLimitExceeded ErrorCode = "RATE_LIMIT_EXCEEDED"
	
	// Resource errors
	ErrResourceNotFound  ErrorCode = "RESOURCE_NOT_FOUND"
	ErrResourceConflict  ErrorCode = "RESOURCE_CONFLICT"
	ErrResourceLimit     ErrorCode = "RESOURCE_LIMIT_EXCEEDED"
)

// AppError represents an application error
type AppError struct {
	Code       ErrorCode `json:"code"`
	Message    string    `json:"message"`
	Details    string    `json:"details,omitempty"`
	HTTPStatus int       `json:"-"`
	RequestID  string    `json:"request_id,omitempty"`
	Timestamp  string    `json:"timestamp"`
}

func (e *AppError) Error() string {
	return fmt.Sprintf("[%s] %s: %s", e.Code, e.Message, e.Details)
}

// New creates a new application error
func New(code ErrorCode, message string, details ...string) *AppError {
	var detail string
	if len(details) > 0 {
		detail = details[0]
	}
	
	httpStatus := getHTTPStatus(code)
	
	return &AppError{
		Code:       code,
		Message:    message,
		Details:    detail,
		HTTPStatus: httpStatus,
		Timestamp:  fmt.Sprintf("%d", time.Now().Unix()),
	}
}

// getHTTPStatus returns the appropriate HTTP status code for an error code
func getHTTPStatus(code ErrorCode) int {
	switch code {
	case ErrInternalServer, ErrServiceUnavailable:
		return http.StatusInternalServerError
	case ErrTimeout:
		return http.StatusRequestTimeout
	case ErrUnauthorized, ErrInvalidToken, ErrTokenExpired:
		return http.StatusUnauthorized
	case ErrForbidden:
		return http.StatusForbidden
	case ErrInvalidInput, ErrMissingField, ErrInvalidFormat:
		return http.StatusBadRequest
	case ErrDockerUnavailable:
		return http.StatusServiceUnavailable
	case ErrContainerNotFound, ErrImageNotFound, ErrNetworkNotFound, ErrVolumeNotFound, ErrResourceNotFound:
		return http.StatusNotFound
	case ErrResourceConflict:
		return http.StatusConflict
	case ErrResourceLimit:
		return http.StatusTooManyRequests
	case ErrRateLimitExceeded:
		return http.StatusTooManyRequests
	default:
		return http.StatusInternalServerError
	}
}

// Predefined errors
var (
	ErrInternalServerError = New(ErrInternalServer, "Internal server error occurred")
	ErrUnauthorizedAccess = New(ErrUnauthorized, "Unauthorized access")
	ErrForbiddenAccess    = New(ErrForbidden, "Access forbidden")
	ErrInvalidInputData   = New(ErrInvalidInput, "Invalid input data")
	ErrDockerNotAvailable = New(ErrDockerUnavailable, "Docker service not available")
	ErrContainerNotExists = New(ErrContainerNotFound, "Container not found")
	ErrImageNotExists     = New(ErrImageNotFound, "Image not found")
	ErrNetworkNotExists   = New(ErrNetworkNotFound, "Network not found")
	ErrVolumeNotExists    = New(ErrVolumeNotFound, "Volume not found")
	ErrRateLimitHit       = New(ErrRateLimitExceeded, "Rate limit exceeded")
)

// Wrap wraps an existing error with additional context
func Wrap(err error, code ErrorCode, message string) *AppError {
	if appErr, ok := err.(*AppError); ok {
		return appErr
	}
	
	return New(code, message, err.Error())
}

// IsAppError checks if an error is an AppError
func IsAppError(err error) bool {
	_, ok := err.(*AppError)
	return ok
}

// GetAppError extracts AppError from an error
func GetAppError(err error) *AppError {
	if appErr, ok := err.(*AppError); ok {
		return appErr
	}
	return nil
}
