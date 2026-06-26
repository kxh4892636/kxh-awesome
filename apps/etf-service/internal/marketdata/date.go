package marketdata

import (
	"fmt"
	"strings"
	"time"
)

const layout = "2006-01-02"

func Compare(left string, right string) int {
	return strings.Compare(left, right)
}

func Max(left string, right string) string {
	if Compare(left, right) >= 0 {
		return left
	}
	return right
}

func Min(left string, right string) string {
	if Compare(left, right) <= 0 {
		return left
	}
	return right
}

func Parse(dateText string) (time.Time, error) {
	parsed, err := time.Parse(layout, dateText)
	if err != nil {
		return time.Time{}, fmt.Errorf("invalid date: %s", dateText)
	}
	return parsed, nil
}

func Format(date time.Time) string {
	return date.UTC().Format(layout)
}

func AddDays(dateText string, days int) (string, error) {
	parsed, err := Parse(dateText)
	if err != nil {
		return "", err
	}
	return Format(parsed.AddDate(0, 0, days)), nil
}

func ListDates(startDate string, endDate string) ([]string, error) {
	current, err := Parse(startDate)
	if err != nil {
		return nil, err
	}
	end, err := Parse(endDate)
	if err != nil {
		return nil, err
	}

	var dates []string
	for !current.After(end) {
		dates = append(dates, Format(current))
		current = current.AddDate(0, 0, 1)
	}
	return dates, nil
}

func IsWeekend(dateText string) (bool, error) {
	parsed, err := Parse(dateText)
	if err != nil {
		return false, err
	}
	weekday := parsed.Weekday()
	return weekday == time.Saturday || weekday == time.Sunday, nil
}

func ShanghaiToday(now time.Time) string {
	location, err := time.LoadLocation("Asia/Shanghai")
	if err != nil {
		location = time.FixedZone("Asia/Shanghai", 8*60*60)
	}
	return now.In(location).Format(layout)
}

func TMinusOne(now time.Time) (string, error) {
	return AddDays(ShanghaiToday(now), -1)
}

func ToURLDate(dateText string) string {
	return strings.ReplaceAll(dateText, "-", "")
}
