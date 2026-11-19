package main

import (
	"fmt"
	"math"
	"math/rand/v2"
	"time"
)

type Reading struct {
	Sensor     string
	Value      float64
	MeasuredAt time.Time
}

// Readings gera uma leitura por sensor: uma onda lenta em torno de uma base própria, com ruído.
func Readings(sensors int, now time.Time) []Reading {
	t := float64(now.Unix())
	out := make([]Reading, sensors)
	for i := range sensors {
		base := 20 + 2*float64(i)
		wave := 3 * math.Sin(2*math.Pi*t/300+float64(i))
		out[i] = Reading{
			Sensor:     fmt.Sprintf("sensor-%d", i+1),
			Value:      math.Round((base+wave+rand.NormFloat64()*0.5)*100) / 100,
			MeasuredAt: now.UTC(),
		}
	}
	return out
}
