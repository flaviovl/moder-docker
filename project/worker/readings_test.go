package main

import (
	"testing"
	"time"
)

func TestReadingsOnePerSensorAroundItsBase(t *testing.T) {
	now := time.Date(2026, 11, 19, 12, 0, 0, 0, time.UTC)
	got := Readings(3, now)
	if len(got) != 3 {
		t.Fatalf("esperava 3 leituras, veio %d", len(got))
	}
	for i, r := range got {
		base := 20 + 2*float64(i)
		if r.Value < base-6 || r.Value > base+6 {
			t.Errorf("%s = %.2f, fora da faixa de %.0f ± 6", r.Sensor, r.Value, base)
		}
		if !r.MeasuredAt.Equal(now) {
			t.Errorf("%s com horário %v, esperava %v", r.Sensor, r.MeasuredAt, now)
		}
	}
}
