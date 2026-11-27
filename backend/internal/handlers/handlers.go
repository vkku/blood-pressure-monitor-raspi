package handlers

import (
	"blood_pressure_monitor/internal/database"
	"blood_pressure_monitor/internal/models"
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
)

// Health check endpoint
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// InitDB initializes the database schema
func InitDB(db *sql.DB) error {
	return models.InitDB(db)
}

// Login user
func LoginUser(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var creds struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var user models.User
	err := database.DB.QueryRow(
		"SELECT id, name, username, created_at FROM users WHERE username = ? AND password = ?",
		creds.Username, creds.Password,
	).Scan(&user.ID, &user.Name, &user.Username, &user.CreatedAt)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid username or password"})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(user)
}

// Get all users
func GetUsers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	rows, err := database.DB.Query("SELECT id, name, username, created_at FROM users ORDER BY name")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Username, &u.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		users = append(users, u)
	}

	if err = rows.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(users)
}

// Create new user
func CreateUser(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Check if username already exists
	var existingID int
	err := database.DB.QueryRow("SELECT id FROM users WHERE username = ?", user.Username).Scan(&existingID)
	if err == nil {
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]string{"error": "Username already exists"})
		return
	}

	result, err := database.DB.Exec(
		"INSERT INTO users (name, username, password) VALUES (?, ?, ?)",
		user.Name, user.Username, user.Password,
	)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	id, _ := result.LastInsertId()
	user.ID = int(id)
	user.Password = "" // Don't return password

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

// Get blood pressure readings for a user
func GetReadings(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	vars := mux.Vars(r)
	userID, err := strconv.Atoi(vars["user_id"])
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Get date range from query params
	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")

	query := "SELECT id, user_id, systolic, diastolic, heart_rate, measurement_time, notes, medication, body_position, arm_used, activity_level, created_at FROM blood_pressure_readings WHERE user_id = ?"
	args := []interface{}{userID}

	if startDate != "" {
		query += " AND measurement_time >= ?"
		args = append(args, startDate)
	}
	if endDate != "" {
		query += " AND measurement_time <= ?"
		args = append(args, endDate)
	}

	query += " ORDER BY measurement_time DESC"

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var readings []models.BloodPressureReading
	for rows.Next() {
		var r models.BloodPressureReading
		if err := rows.Scan(&r.ID, &r.UserID, &r.Systolic, &r.Diastolic, &r.HeartRate, &r.MeasurementTime, &r.Notes, &r.Medication, &r.BodyPosition, &r.ArmUsed, &r.ActivityLevel, &r.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		readings = append(readings, r)
	}

	if err = rows.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(readings)
}

// Create new blood pressure reading
func CreateReading(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	vars := mux.Vars(r)
	userID, err := strconv.Atoi(vars["user_id"])
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	var reading models.BloodPressureReading
	if err := json.NewDecoder(r.Body).Decode(&reading); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	reading.UserID = userID

	if reading.MeasurementTime.IsZero() {
		reading.MeasurementTime = time.Now()
	}

	result, err := database.DB.Exec(
		`INSERT INTO blood_pressure_readings 
		(user_id, systolic, diastolic, heart_rate, measurement_time, notes, medication, body_position, arm_used, activity_level) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		reading.UserID, reading.Systolic, reading.Diastolic, reading.HeartRate, 
		reading.MeasurementTime, reading.Notes, reading.Medication, 
		reading.BodyPosition, reading.ArmUsed, reading.ActivityLevel,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()
	reading.ID = int(id)

	// Check for high/low blood pressure alerts
	checkBPAlerts(w, &reading)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reading)
}

// Check blood pressure and create alerts if needed
func checkBPAlerts(w http.ResponseWriter, reading *models.BloodPressureReading) {
	// High blood pressure: systolic >= 140 or diastolic >= 90
	if reading.Systolic >= 140 || reading.Diastolic >= 90 {
		createAlert(reading.UserID, "high_bp", "High blood pressure detected", "warning")
	}
	
	// Low blood pressure: systolic < 90 or diastolic < 60
	if reading.Systolic < 90 || reading.Diastolic < 60 {
		createAlert(reading.UserID, "low_bp", "Low blood pressure detected", "warning")
	}
	
	// High heart rate: > 100
	if reading.HeartRate > 100 {
		createAlert(reading.UserID, "high_heart_rate", "High heart rate detected", "warning")
	}
	
	// Low heart rate: < 60
	if reading.HeartRate < 60 {
		createAlert(reading.UserID, "low_heart_rate", "Low heart rate detected", "warning")
	}
}

// Create an alert
func createAlert(userID int, alertType, message, severity string) {
	database.DB.Exec(
		"INSERT INTO alerts (user_id, alert_type, message, severity) VALUES (?, ?, ?, ?)",
		userID, alertType, message, severity,
	)
}

// Delete a reading
func DeleteReading(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	vars := mux.Vars(r)
	userID, err := strconv.Atoi(vars["user_id"])
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	readingID, err := strconv.Atoi(vars["reading_id"])
	if err != nil {
		http.Error(w, "Invalid reading ID", http.StatusBadRequest)
		return
	}

	// Delete the reading (ensure it belongs to the user)
	result, err := database.DB.Exec(
		"DELETE FROM blood_pressure_readings WHERE id = ? AND user_id = ?",
		readingID, userID,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "Reading not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
}

// Get alerts for a user
func GetAlerts(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	vars := mux.Vars(r)
	userID, err := strconv.Atoi(vars["user_id"])
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	rows, err := database.DB.Query(
		"SELECT id, user_id, alert_type, message, severity, is_read, created_at FROM alerts WHERE user_id = ? ORDER BY created_at DESC",
		userID,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var alerts []models.Alert
	for rows.Next() {
		var a models.Alert
		var isRead int
		if err := rows.Scan(&a.ID, &a.UserID, &a.AlertType, &a.Message, &a.Severity, &isRead, &a.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		a.IsRead = isRead == 1
		alerts = append(alerts, a)
	}

	if err = rows.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(alerts)
}

// Mark alert as read
func MarkAlertAsRead(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	vars := mux.Vars(r)
	alertID, err := strconv.Atoi(vars["alert_id"])
	if err != nil {
		http.Error(w, "Invalid alert ID", http.StatusBadRequest)
		return
	}

	_, err = database.DB.Exec("UPDATE alerts SET is_read = 1 WHERE id = ?", alertID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

// Get daily trends for a user
func GetDailyTrends(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	vars := mux.Vars(r)
	userID, err := strconv.Atoi(vars["user_id"])
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Get days parameter, default to 7
	days := 7
	if daysParam := r.URL.Query().Get("days"); daysParam != "" {
		if d, err := strconv.Atoi(daysParam); err == nil && d > 0 {
			days = d
			if days > 365 {
				days = 365 // Cap at 1 year
			}
		}
	}

	// Get readings for the specified number of days
	query := `SELECT DATE(measurement_time) as date, 
		AVG(systolic) as avg_systolic, 
		AVG(diastolic) as avg_diastolic,
		AVG(heart_rate) as avg_heart_rate,
		COUNT(*) as reading_count
		FROM blood_pressure_readings 
		WHERE user_id = ? AND measurement_time >= date('now', '-' || ? || ' days')
		GROUP BY DATE(measurement_time)
		ORDER BY date ASC`
	
	rows, err := database.DB.Query(query, userID, days)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var trends []map[string]interface{}
	for rows.Next() {
		var date string
		var avgSystolic, avgDiastolic, avgHeartRate float64
		var readingCount int
		if err := rows.Scan(&date, &avgSystolic, &avgDiastolic, &avgHeartRate, &readingCount); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		trends = append(trends, map[string]interface{}{
			"date":            date,
			"avg_systolic":    avgSystolic,
			"avg_diastolic":   avgDiastolic,
			"avg_heart_rate":  avgHeartRate,
			"reading_count":   readingCount,
		})
	}

	if err = rows.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(trends)
}

// Get weekly summary for a user
func GetWeeklySummary(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	vars := mux.Vars(r)
	userID, err := strconv.Atoi(vars["user_id"])
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Get weekly statistics using COALESCE to handle NULL when no readings exist
	var maxSystolic, minSystolic, avgSystolic float64
	var maxDiastolic, minDiastolic, avgDiastolic float64
	var maxHeartRate, minHeartRate, avgHeartRate float64
	var totalReadings int
	
	err = database.DB.QueryRow(
		`SELECT 
		COALESCE(MAX(systolic), 0),
		COALESCE(MIN(systolic), 0),
		COALESCE(AVG(systolic), 0),
		COALESCE(MAX(diastolic), 0),
		COALESCE(MIN(diastolic), 0),
		COALESCE(AVG(diastolic), 0),
		COALESCE(MAX(heart_rate), 0),
		COALESCE(MIN(heart_rate), 0),
		COALESCE(AVG(heart_rate), 0),
		COUNT(*) as total_readings
		FROM blood_pressure_readings 
		WHERE user_id = ? AND measurement_time >= date('now', '-7 days')`,
		userID,
	).Scan(
		&maxSystolic, &minSystolic, &avgSystolic,
		&maxDiastolic, &minDiastolic, &avgDiastolic,
		&maxHeartRate, &minHeartRate, &avgHeartRate,
		&totalReadings,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	summary := map[string]interface{}{
		"max_systolic":     maxSystolic,
		"min_systolic":     minSystolic,
		"avg_systolic":     avgSystolic,
		"max_diastolic":    maxDiastolic,
		"min_diastolic":    minDiastolic,
		"avg_diastolic":    avgDiastolic,
		"max_heart_rate":   maxHeartRate,
		"min_heart_rate":   minHeartRate,
		"avg_heart_rate":   avgHeartRate,
		"total_readings":   totalReadings,
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(summary)
}

// Export readings to CSV format
func ExportCSV(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=blood_pressure_readings.csv")
	
	vars := mux.Vars(r)
	userID, err := strconv.Atoi(vars["user_id"])
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	rows, err := database.DB.Query(
		`SELECT measurement_time, systolic, diastolic, heart_rate, notes, medication, body_position, arm_used, activity_level 
		FROM blood_pressure_readings 
		WHERE user_id = ? 
		ORDER BY measurement_time DESC`,
		userID,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Write CSV header
	w.Write([]byte("Date,Systolic,Diastolic,Heart Rate,Notes,Medication,Body Position,Arm Used,Activity Level\n"))

	for rows.Next() {
		var row []string
		var measurementTime time.Time
		if err := rows.Scan(&measurementTime, &row[1], &row[2], &row[3], &row[4], &row[5], &row[6], &row[7], &row[8]); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Write([]byte(measurementTime.Format("2006-01-02 15:04:05") + "," + row[1] + "," + row[2] + "," + row[3] + "," + row[4] + "," + row[5] + "," + row[6] + "," + row[7] + "," + row[8] + "\n"))
	}

	if err = rows.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
