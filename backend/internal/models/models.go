package models

import (
	"database/sql"
	"time"
)

type User struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Username  string    `json:"username"`
	Password  string    `json:"password"`
	CreatedAt time.Time `json:"created_at"`
}

type BloodPressureReading struct {
	ID           int       `json:"id"`
	UserID       int       `json:"user_id"`
	Systolic     int       `json:"systolic"`
	Diastolic    int       `json:"diastolic"`
	HeartRate    int       `json:"heart_rate"`
	MeasurementTime time.Time `json:"measurement_time"`
	Notes        string    `json:"notes"`
	Medication   string    `json:"medication"`
	BodyPosition string    `json:"body_position"`
	ArmUsed      string    `json:"arm_used"`
	ActivityLevel string   `json:"activity_level"`
	CreatedAt    time.Time `json:"created_at"`
}

type Alert struct {
	ID           int       `json:"id"`
	UserID       int       `json:"user_id"`
	AlertType    string    `json:"alert_type"`
	Message      string    `json:"message"`
	Severity     string    `json:"severity"`
	IsRead       bool      `json:"is_read"`
	CreatedAt    time.Time `json:"created_at"`
}

func InitDB(db *sql.DB) error {
	// Create users table
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			username TEXT UNIQUE NOT NULL,
			password TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return err
	}

	// Create blood pressure readings table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS blood_pressure_readings (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			systolic INTEGER NOT NULL,
			diastolic INTEGER NOT NULL,
			heart_rate INTEGER NOT NULL,
			measurement_time DATETIME DEFAULT CURRENT_TIMESTAMP,
			notes TEXT,
			medication TEXT,
			body_position TEXT,
			arm_used TEXT,
			activity_level TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id)
		)
	`)
	if err != nil {
		return err
	}

	// Create alerts table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS alerts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			alert_type TEXT NOT NULL,
			message TEXT NOT NULL,
			severity TEXT NOT NULL,
			is_read INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id)
		)
	`)
	if err != nil {
		return err
	}

	return nil
}
