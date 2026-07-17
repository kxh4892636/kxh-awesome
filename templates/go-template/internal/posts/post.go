package posts

type Post struct {
	ID     int32  `gorm:"primaryKey;column:id"`
	UserID int32  `gorm:"column:user_id;not null"`
	Title  string `gorm:"column:title;not null"`
	Body   string `gorm:"column:body;not null"`
}

func (Post) TableName() string {
	return "posts"
}
