-- Esquema relacional para el banco de preguntas (compatible con SQLite y PostgreSQL).
-- Cargar con:  sqlite3 preguntas.db < db/schema.sql && sqlite3 preguntas.db < db/seed.sql

CREATE TABLE niveles (
  id          INTEGER PRIMARY KEY,          -- 1 Ligera, 2 Media, 3 Profunda
  nombre      VARCHAR(30)  NOT NULL UNIQUE,
  descripcion VARCHAR(200) NOT NULL
);

CREATE TABLE categorias (
  id          VARCHAR(30)  PRIMARY KEY,     -- ej. 'conocernos'
  prefijo     CHAR(3)      NOT NULL UNIQUE, -- ej. 'con' -> IDs 'con-001'
  nombre      VARCHAR(60)  NOT NULL UNIQUE,
  descripcion VARCHAR(200) NOT NULL,
  emoji       VARCHAR(8)   NOT NULL,
  color       CHAR(7)      NOT NULL,
  adulto      SMALLINT     NOT NULL DEFAULT 0 CHECK (adulto IN (0, 1))
);

CREATE TABLE subcategorias (
  categoria_id VARCHAR(30) NOT NULL REFERENCES categorias(id),
  id           VARCHAR(30) NOT NULL,
  nombre       VARCHAR(60) NOT NULL,
  PRIMARY KEY (categoria_id, id)
);

CREATE TABLE preguntas (
  id                VARCHAR(10)  PRIMARY KEY,  -- '<prefijo>-<nnn>'
  categoria_id      VARCHAR(30)  NOT NULL,
  subcategoria_id   VARCHAR(30)  NOT NULL,
  nivel_id          INTEGER      NOT NULL REFERENCES niveles(id),
  texto             VARCHAR(300) NOT NULL,
  contexto          VARCHAR(300),              -- aclaración opcional, ej. "un martes normal"
  -- minúsculas, sin acentos ni signos: evita duplicados con distinta puntuación
  texto_normalizado VARCHAR(300) NOT NULL UNIQUE,
  activa            SMALLINT     NOT NULL DEFAULT 1,
  FOREIGN KEY (categoria_id, subcategoria_id) REFERENCES subcategorias(categoria_id, id)
);

-- Preguntas de apoyo que ayudan a desarrollar la pregunta principal.
CREATE TABLE subpreguntas (
  pregunta_id VARCHAR(10)  NOT NULL REFERENCES preguntas(id),
  orden       SMALLINT     NOT NULL,
  texto       VARCHAR(300) NOT NULL,
  PRIMARY KEY (pregunta_id, orden)
);

CREATE INDEX idx_preguntas_categoria ON preguntas (categoria_id, subcategoria_id);
CREATE INDEX idx_preguntas_nivel ON preguntas (nivel_id);
