package main

import (
	"blood_pressure_monitor/internal/database"
	"blood_pressure_monitor/internal/handlers"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/gorilla/mux"
	"gopkg.in/yaml.v2"
)

type Config struct {
	Server struct {
		Host string `yaml:"host"`
		Port int    `yaml:"port"`
	} `yaml:"server"`
}

func loadConfig() (*Config, error) {
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		configPath = "../config/config.yaml"
	}
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, err
	}

	var config Config
	err = yaml.Unmarshal(data, &config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}

func main() {
	// Load configuration
	config, err := loadConfig()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	// Connect to database
	if err := database.Connect(); err != nil {
		log.Fatal(err)
	}
	defer database.Close()

	// Initialize database schema
	if err := handlers.InitDB(database.DB); err != nil {
		log.Fatal(err)
	}

	// Create router
	r := mux.NewRouter()

	// Add CORS headers
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			
			next.ServeHTTP(w, r)
		})
	})

	// Health check
	r.HandleFunc("/api/health", handlers.HealthCheck).Methods("GET")

	// User endpoints
	r.HandleFunc("/api/login", handlers.LoginUser).Methods("POST")
	r.HandleFunc("/api/users", handlers.GetUsers).Methods("GET")
	r.HandleFunc("/api/users", handlers.CreateUser).Methods("POST")

	// Blood pressure reading endpoints
	r.HandleFunc("/api/users/{user_id}/readings", handlers.GetReadings).Methods("GET")
	r.HandleFunc("/api/users/{user_id}/readings", handlers.CreateReading).Methods("POST")
	r.HandleFunc("/api/users/{user_id}/readings/daily-trends", handlers.GetDailyTrends).Methods("GET")
	r.HandleFunc("/api/users/{user_id}/readings/weekly-summary", handlers.GetWeeklySummary).Methods("GET")
	r.HandleFunc("/api/users/{user_id}/readings/export", handlers.ExportCSV).Methods("GET")

	// Alert endpoints
	r.HandleFunc("/api/users/{user_id}/alerts", handlers.GetAlerts).Methods("GET")
	r.HandleFunc("/api/users/{user_id}/alerts/{alert_id}/read", handlers.MarkAlertAsRead).Methods("PUT")

	// Serve frontend static files
	frontendPath := os.Getenv("FRONTEND_PATH")
	if frontendPath == "" {
		frontendPath = "../frontend"
	}
	r.PathPrefix("/").Handler(http.FileServer(http.Dir(frontendPath)))

	// Start server on configured port
	addr := config.Server.Host + ":" + strconv.Itoa(config.Server.Port)
	log.Println("Starting server on", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatal(err)
	}
}
