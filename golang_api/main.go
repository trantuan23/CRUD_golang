package main

import (
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// TodoItem represents a task with a title, description, and status
type TodoItem struct {
	Id         int        `json:"id" gorm:"primaryKey"`
	Title      string     `json:"title"`
	Desciption string     `json:"desciption"`
	Status     string     `json:"status" gorm:"type:varchar(255)"`
	CreatedAt  *time.Time `json:"created_at"`
	UpdatedAt  *time.Time `json:"updated_at"`
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatalln("Error loading .env file")
	}

	dsn := os.Getenv("DSN")
	if dsn == "" {
		log.Fatalln("DSN environment variable not set")
	}

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalln("Failed to connect to database:", err)
	}

	if err := db.AutoMigrate(&TodoItem{}); err != nil {
		log.Fatalln("Failed to auto migrate:", err)
	}

	r := gin.Default()

	// Set up CORS middleware
	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"}, // Adjust this to your frontend URL
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders:   []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: true,
	})

	v1 := r.Group("/v1")
	{
		items := v1.Group("/items")
		{
			items.POST("/", CreateItem(db))
			items.GET("/:id", GetItemById(db))
			items.PUT("/:id", UpdateItem(db))
			items.GET("/", GetItemList(db))
			items.DELETE("/:id", DeleteItem(db))
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Apply the CORS middleware to the Gin router
	handler := corsMiddleware.Handler(r)
	http.ListenAndServe(":"+port, handler)
}

func CreateItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var newItem TodoItem
		if err := c.ShouldBindJSON(&newItem); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Create(&newItem).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, newItem)
	}
}

func GetItemById(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var data TodoItem
		id, err := strconv.Atoi(c.Param("id"))

		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
			return
		}

		if err := db.Where("id = ?", id).First(&data).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": data})
	}
}

func UpdateItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var data TodoItem
		id, err := strconv.Atoi(c.Param("id"))

		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
			return
		}

		if err := db.Where("id = ?", id).First(&data).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
			return
		}

		if err := c.ShouldBindJSON(&data); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Save(&data).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, data)
	}
}

func GetItemList(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var items []TodoItem

		page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
		if err != nil || page < 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid page parameter"})
			return
		}

		limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
		if err != nil || limit < 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit parameter"})
			return
		}

		offset := (page - 1) * limit

		var totalCount int64
		if err := db.Model(&TodoItem{}).Count(&totalCount).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if err := db.Order("id desc").Limit(limit).Offset(offset).Find(&items).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": items,
			"pagination": gin.H{
				"page":  page,
				"limit": limit,
				"total": totalCount,
			},
		})
	}
}

func DeleteItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))

		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
			return
		}

		var item TodoItem
		if err := db.First(&item, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if err := db.Delete(&item).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Item deleted successfully"})
	}
}
