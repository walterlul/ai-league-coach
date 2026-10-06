CREATE TABLE campeon (
  id    INTEGER PRIMARY KEY,   -- el championId que da Riot
  nombre TEXT NOT NULL
);

CREATE TABLE jugador (
  puuid      TEXT PRIMARY KEY,
  riot_name  TEXT NOT NULL,
  riot_tag   TEXT NOT NULL,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE partida (
  id          TEXT PRIMARY KEY,        -- matchId de Riot, ej: "LA2_123456"
  cola        INTEGER NOT NULL,        -- tipo de partida (ranked, normal...)
  duracion_seg INTEGER NOT NULL,
  jugada_en   TIMESTAMPTZ NOT NULL,
  parche      TEXT NOT NULL,
  raw_data    JSONB                    -- JSON crudo de Riot, por si cambia
);

CREATE TABLE jugador_partida (
  puuid       TEXT    NOT NULL REFERENCES jugador(puuid),
  partida_id  TEXT    NOT NULL REFERENCES partida(id),
  campeon_id  INTEGER NOT NULL REFERENCES campeon(id),
  equipo      INTEGER NOT NULL,        -- 100 o 200
  gano        BOOLEAN NOT NULL,
  kills       INTEGER NOT NULL,
  muertes     INTEGER NOT NULL,
  asistencias INTEGER NOT NULL,
  cs          INTEGER NOT NULL,
  oro         INTEGER NOT NULL,
  PRIMARY KEY (puuid, partida_id)
);
