package database

import (
	"database/sql"
	"fmt"
	"time"
)

type EncryptedSecret struct {
	ID        int64
	Name      string
	Value     string // AES-256-GCM encrypted
	Category  string
	CreatedBy int64
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (d *Database) StoreSecret(name, encryptedValue, category string, userID int64) (*EncryptedSecret, error) {
	_, err := d.db.Exec(
		`INSERT INTO encrypted_secrets (name, encrypted_value, category, created_by)
		 VALUES (?, ?, ?, ?)
		 ON CONFLICT(name) DO UPDATE SET encrypted_value=excluded.encrypted_value, category=excluded.category, updated_at=CURRENT_TIMESTAMP`,
		name, encryptedValue, category, userID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to store secret: %w", err)
	}

	return d.GetSecretByName(name)
}

func (d *Database) GetSecretByName(name string) (*EncryptedSecret, error) {
	row := d.db.QueryRow(
		`SELECT id, name, encrypted_value, COALESCE(category,''), created_by, created_at, updated_at
		 FROM encrypted_secrets WHERE name = ?`, name,
	)
	return scanSecret(row)
}

func (d *Database) ListSecrets(userID int64) ([]EncryptedSecret, error) {
	rows, err := d.db.Query(
		`SELECT id, name, encrypted_value, COALESCE(category,''), created_by, created_at, updated_at
		 FROM encrypted_secrets WHERE created_by = ? ORDER BY name`, userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var secrets []EncryptedSecret
	for rows.Next() {
		var s EncryptedSecret
		if err := rows.Scan(&s.ID, &s.Name, &s.Value, &s.Category, &s.CreatedBy, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		secrets = append(secrets, s)
	}
	return secrets, nil
}

func (d *Database) DeleteSecret(name string, userID int64) error {
	result, err := d.db.Exec(`DELETE FROM encrypted_secrets WHERE name = ? AND created_by = ?`, name, userID)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func scanSecret(row *sql.Row) (*EncryptedSecret, error) {
	s := &EncryptedSecret{}
	err := row.Scan(&s.ID, &s.Name, &s.Value, &s.Category, &s.CreatedBy, &s.CreatedAt, &s.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return s, nil
}
