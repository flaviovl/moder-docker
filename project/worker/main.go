// Worker: grava leituras sintéticas de sensores no Postgres em intervalos regulares.
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	cfg, err := pgxpool.ParseConfig(os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("DATABASE_URL inválida: %v", err)
	}
	if path := os.Getenv("DB_PASSWORD_FILE"); path != "" {
		password, err := os.ReadFile(path)
		if err != nil {
			log.Fatalf("não consegui ler DB_PASSWORD_FILE: %v", err)
		}
		cfg.ConnConfig.Password = strings.TrimSpace(string(password))
	}

	pool, err := connect(ctx, cfg)
	if err != nil {
		log.Printf("encerrando: %v", err)
		return
	}
	defer pool.Close()

	sensors := envInt("SENSORS", 5)
	interval := time.Duration(envInt("INTERVAL_SECONDS", 2)) * time.Second
	log.Printf("gravando %d sensores a cada %s", sensors, interval)

	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	written, lastLog := 0, time.Now()
	for {
		select {
		case <-ctx.Done():
			log.Print("sinal recebido, encerrando")
			return
		case now := <-ticker.C:
			if err := insertReadings(ctx, pool, Readings(sensors, now)); err != nil {
				log.Printf("falha ao gravar: %v", err)
				continue
			}
			written += sensors
			if now.Sub(lastLog) >= 10*time.Second {
				log.Printf("%d leituras gravadas nos últimos %.0f s", written, now.Sub(lastLog).Seconds())
				written, lastLog = 0, now
			}
		}
	}
}

// connect tenta até o banco aceitar conexões: o worker pode subir antes do Postgres.
func connect(ctx context.Context, cfg *pgxpool.Config) (*pgxpool.Pool, error) {
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, err
	}
	for wait := time.Second; ; wait = min(wait*2, 10*time.Second) {
		if err = pool.Ping(ctx); err == nil {
			return pool, nil
		}
		log.Printf("banco indisponível (%v), nova tentativa em %s", err, wait)
		select {
		case <-ctx.Done():
			pool.Close()
			return nil, ctx.Err()
		case <-time.After(wait):
		}
	}
}

func insertReadings(ctx context.Context, pool *pgxpool.Pool, readings []Reading) error {
	for _, r := range readings {
		if _, err := pool.Exec(ctx,
			"INSERT INTO readings (sensor, value, measured_at) VALUES ($1, $2, $3)",
			r.Sensor, r.Value, r.MeasuredAt); err != nil {
			return fmt.Errorf("insert: %w", err)
		}
	}
	return nil
}

func envInt(name string, fallback int) int {
	if v, err := strconv.Atoi(os.Getenv(name)); err == nil && v > 0 {
		return v
	}
	return fallback
}
