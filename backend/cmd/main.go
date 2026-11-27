package main

import (
	"blood_pressure_monitor/internal/database"
	"blood_pressure_monitor/internal/handlers"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

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

	// Health check endpoint
	r.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	}).Methods("GET")

	// Serve frontend static files (SPA with fallback to index.html)
	frontendPath := os.Getenv("FRONTEND_PATH")
	if frontendPath == "" {
		frontendPath = "../frontend"
	}
	
	// Check if dist folder exists (production build)
	distPath := filepath.Join(frontendPath, "dist")
	if _, err := os.Stat(distPath); err == nil {
		frontendPath = distPath
	}
	
	log.Printf("Serving frontend from: %s", frontendPath)
	r.PathPrefix("/").Handler(spaHandler{staticPath: frontendPath, indexPath: "index.html"})

	// Start server on configured port
	addr := config.Server.Host + ":" + strconv.Itoa(config.Server.Port)
	log.Println("Starting server on", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatal(err)
	}
}

// spaHandler serves static files and falls back to index.html for SPA routing
type spaHandler struct {
	staticPath string
	indexPath  string
}

func (h spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Get the absolute path to prevent directory traversal
	path := filepath.Join(h.staticPath, filepath.Clean(r.URL.Path))

	// Check if path is a file that exists
	fi, err := os.Stat(path)
	if os.IsNotExist(err) || fi.IsDir() {
		// File doesn't exist or is directory, serve index.html for SPA routing
		http.ServeFile(w, r, filepath.Join(h.staticPath, h.indexPath))
		return
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Set appropriate content types for common static file extensions
	ext := strings.ToLower(filepath.Ext(path))
	switch ext {
	case ".js":
		w.Header().Set("Content-Type", "application/javascript")
	case ".css":
		w.Header().Set("Content-Type", "text/css")
	case ".svg":
		w.Header().Set("Content-Type", "image/svg+xml")
	case ".json":
		w.Header().Set("Content-Type", "application/json")
	}

	// Serve the actual file
	http.ServeFile(w, r, path)
}
