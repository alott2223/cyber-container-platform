package logger

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"
)

type LogLevel string

const (
	DEBUG LogLevel = "DEBUG"
	INFO  LogLevel = "INFO"
	WARN  LogLevel = "WARN"
	ERROR LogLevel = "ERROR"
	FATAL LogLevel = "FATAL"
)

type LogEntry struct {
	Timestamp time.Time `json:"timestamp"`
	Level     LogLevel  `json:"level"`
	Message   string    `json:"message"`
	Service   string    `json:"service"`
	RequestID string    `json:"request_id,omitempty"`
	UserID    string    `json:"user_id,omitempty"`
	Error     string    `json:"error,omitempty"`
	Data      map[string]interface{} `json:"data,omitempty"`
}

type Logger struct {
	service string
	level   LogLevel
}

func New(service string, level LogLevel) *Logger {
	return &Logger{
		service: service,
		level:   level,
	}
}

func (l *Logger) log(level LogLevel, message string, data map[string]interface{}) {
	if l.shouldLog(level) {
		entry := LogEntry{
			Timestamp: time.Now(),
			Level:     level,
			Message:   message,
			Service:   l.service,
			Data:      data,
		}
		
		if jsonData, err := json.Marshal(entry); err == nil {
			fmt.Println(string(jsonData))
		} else {
			log.Printf("[%s] %s: %s", level, l.service, message)
		}
	}
}

func (l *Logger) shouldLog(level LogLevel) bool {
	levels := map[LogLevel]int{
		DEBUG: 0,
		INFO:  1,
		WARN:  2,
		ERROR: 3,
		FATAL: 4,
	}
	
	return levels[level] >= levels[l.level]
}

func (l *Logger) Debug(message string, data ...map[string]interface{}) {
	var mergedData map[string]interface{}
	if len(data) > 0 {
		mergedData = data[0]
	}
	l.log(DEBUG, message, mergedData)
}

func (l *Logger) Info(message string, data ...map[string]interface{}) {
	var mergedData map[string]interface{}
	if len(data) > 0 {
		mergedData = data[0]
	}
	l.log(INFO, message, mergedData)
}

func (l *Logger) Warn(message string, data ...map[string]interface{}) {
	var mergedData map[string]interface{}
	if len(data) > 0 {
		mergedData = data[0]
	}
	l.log(WARN, message, mergedData)
}

func (l *Logger) Error(message string, err error, data ...map[string]interface{}) {
	var mergedData map[string]interface{}
	if len(data) > 0 {
		mergedData = data[0]
	} else {
		mergedData = make(map[string]interface{})
	}
	
	if err != nil {
		mergedData["error"] = err.Error()
	}
	
	l.log(ERROR, message, mergedData)
}

func (l *Logger) Fatal(message string, err error, data ...map[string]interface{}) {
	var mergedData map[string]interface{}
	if len(data) > 0 {
		mergedData = data[0]
	} else {
		mergedData = make(map[string]interface{})
	}
	
	if err != nil {
		mergedData["error"] = err.Error()
	}
	
	l.log(FATAL, message, mergedData)
	os.Exit(1)
}

// Request-scoped logger
func (l *Logger) WithRequestID(requestID string) *Logger {
	return &Logger{
		service: l.service,
		level:   l.level,
	}
}

func (l *Logger) WithUserID(userID string) *Logger {
	return &Logger{
		service: l.service,
		level:   l.level,
	}
}
