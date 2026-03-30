-- Crear tabla para registros de tensión arterial y pulsaciones
CREATE TABLE IF NOT EXISTS registros_tension (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  sistolica INTEGER NOT NULL CHECK (sistolica >= 70 AND sistolica <= 250),
  diastolica INTEGER NOT NULL CHECK (diastolica >= 40 AND diastolica <= 150),
  pulsaciones INTEGER NOT NULL CHECK (pulsaciones >= 30 AND pulsaciones <= 200),
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para mejorar consultas por fecha
CREATE INDEX IF NOT EXISTS idx_tension_timestamp ON registros_tension(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tension_fecha ON registros_tension(fecha DESC);
