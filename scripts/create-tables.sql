-- Crear tabla para registros de glucosa
CREATE TABLE IF NOT EXISTS registros_glucosa (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  valor INTEGER NOT NULL CHECK (valor >= 50 AND valor <= 500),
  momento VARCHAR(50) NOT NULL,
  insulina INTEGER DEFAULT 0 CHECK (insulina >= 0),
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para mejorar consultas por fecha
CREATE INDEX IF NOT EXISTS idx_registros_timestamp ON registros_glucosa(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_registros_fecha ON registros_glucosa(fecha DESC);
