package database

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/glebarez/sqlite"
)

var DB *sql.DB

func Connect() error {
	var err error
	dbPath := "../database/blood_pressure.db"
	
	// Ensure database directory exists
	dbDir := "../database"
	if _, err := os.Stat(dbDir); os.IsNotExist(err) {
		os.MkdirAll(dbDir, 0755)
	}

	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return err
	}

	// Test connection
	if err = DB.Ping(); err != nil {
		return err
	}

	log.Println("Successfully connected to SQLite database")
	return nil
}

func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}
