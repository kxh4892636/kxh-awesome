package config

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestLoadUsesDefaultsWhenDotEnvIsMissing(t *testing.T) {
	clearRuntimeConfig(t)

	loaded, err := Load(filepath.Join(t.TempDir(), ".env"))
	if err != nil {
		t.Fatalf("Load returned error: %v", err)
	}
	if loaded.Port != 8080 {
		t.Fatalf("Port = %d, want 8080", loaded.Port)
	}
	if loaded.DatabaseDSN != "./data/etf-service.sqlite" {
		t.Fatalf("DatabaseDSN = %q, want default", loaded.DatabaseDSN)
	}
}

func TestLoadReadsDotEnvWithoutOverridingProcessEnvironment(t *testing.T) {
	clearRuntimeConfig(t)
	t.Setenv("PORT", "9090")
	t.Setenv("DATABASE_DSN", "process.sqlite")
	dotEnvPath := writeDotEnv(t, "PORT=8081\nDATABASE_DSN=file.sqlite\n")

	loaded, err := Load(dotEnvPath)
	if err != nil {
		t.Fatalf("Load returned error: %v", err)
	}
	if loaded.Port != 9090 {
		t.Fatalf("Port = %d, want 9090", loaded.Port)
	}
	if loaded.DatabaseDSN != "process.sqlite" {
		t.Fatalf("DatabaseDSN = %q, want process.sqlite", loaded.DatabaseDSN)
	}
}

func TestLoadRejectsInvalidConfiguration(t *testing.T) {
	tests := []struct {
		name      string
		contents  string
		wantError string
	}{
		{name: "legacy database key", contents: "DATABASE_URL=value\n", wantError: "unknown key"},
		{name: "malformed line", contents: "PORT\n", wantError: "malformed"},
		{name: "empty value", contents: "DATABASE_DSN=\n", wantError: "empty value"},
		{name: "invalid port", contents: "PORT=70000\n", wantError: "PORT"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			clearRuntimeConfig(t)
			_, err := Load(writeDotEnv(t, test.contents))
			if err == nil {
				t.Fatal("Load returned nil error")
			}
			if !strings.Contains(err.Error(), test.wantError) {
				t.Fatalf("error = %q, want %q", err, test.wantError)
			}
		})
	}
}

func clearRuntimeConfig(t *testing.T) {
	t.Helper()
	t.Setenv("PORT", "")
	t.Setenv("DATABASE_DSN", "")
}

func writeDotEnv(t *testing.T, contents string) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), ".env")
	if err := os.WriteFile(path, []byte(contents), 0o600); err != nil {
		t.Fatalf("write .env: %v", err)
	}
	return path
}
