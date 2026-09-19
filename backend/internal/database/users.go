package database

import (
	"database/sql"
	"fmt"
	"time"
)

type User struct {
	ID                 int64
	Username           string
	PasswordHash       string
	Email              string
	Role               string
	MustChangePassword bool
	CreatedAt          time.Time
}

func (d *Database) GetUserByUsername(username string) (*User, error) {
	row := d.db.QueryRow(
		`SELECT id, username, password_hash, COALESCE(email, ''), COALESCE(role, 'user'), must_change_password, created_at
		 FROM users WHERE username = ?`,
		username,
	)

	user := &User{}
	var mustChange int
	err := row.Scan(
		&user.ID,
		&user.Username,
		&user.PasswordHash,
		&user.Email,
		&user.Role,
		&mustChange,
		&user.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	user.MustChangePassword = mustChange == 1
	return user, nil
}

func (d *Database) CreateUser(username, passwordHash, email, role string, mustChangePassword bool) (*User, error) {
	mustChange := 0
	if mustChangePassword {
		mustChange = 1
	}

	result, err := d.db.Exec(
		`INSERT INTO users (username, password_hash, email, role, must_change_password) VALUES (?, ?, ?, ?, ?)`,
		username, passwordHash, email, role, mustChange,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get user id: %w", err)
	}

	return &User{
		ID:                 id,
		Username:           username,
		PasswordHash:       passwordHash,
		Email:              email,
		Role:               role,
		MustChangePassword: mustChangePassword,
	}, nil
}

func (d *Database) UpdatePassword(userID int64, passwordHash string) error {
	_, err := d.db.Exec(
		`UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?`,
		passwordHash, userID,
	)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}
	return nil
}

func (d *Database) CountUsers() (int, error) {
	var count int
	err := d.db.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count users: %w", err)
	}
	return count, nil
}

func (d *Database) LogAuditEvent(userID *int64, username, action, resource, details, ipAddress string, success bool) error {
	successVal := 0
	if success {
		successVal = 1
	}

	_, err := d.db.Exec(
		`INSERT INTO audit_logs (user_id, username, action, resource, details, ip_address, success)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		userID, username, action, resource, details, ipAddress, successVal,
	)
	if err != nil {
		return fmt.Errorf("failed to log audit event: %w", err)
	}
	return nil
}

func (d *Database) Ping() error {
	return d.db.Ping()
}
