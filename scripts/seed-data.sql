-- Insertar datos de ejemplo
INSERT INTO registros_glucosa (fecha, hora, valor, momento, insulina, timestamp) VALUES
  (CURRENT_DATE, '08:00:00', 95, 'Ayunas', 4, EXTRACT(EPOCH FROM NOW()) * 1000),
  (CURRENT_DATE - INTERVAL '1 day', '14:30:00', 140, '2h Después comida', 6, EXTRACT(EPOCH FROM NOW() - INTERVAL '1 day') * 1000),
  (CURRENT_DATE - INTERVAL '2 days', '07:45:00', 88, 'Ayunas', 4, EXTRACT(EPOCH FROM NOW() - INTERVAL '2 days') * 1000),
  (CURRENT_DATE - INTERVAL '3 days', '20:15:00', 165, '2h Después cena', 5, EXTRACT(EPOCH FROM NOW() - INTERVAL '3 days') * 1000),
  (CURRENT_DATE - INTERVAL '4 days', '12:00:00', 110, 'Antes comida', 0, EXTRACT(EPOCH FROM NOW() - INTERVAL '4 days') * 1000);
