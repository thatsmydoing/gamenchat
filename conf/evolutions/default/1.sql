# --- !Ups

CREATE TABLE words (
  id integer PRIMARY KEY,
  word text NOT NULL
);

CREATE TABLE taboo (
  id integer PRIMARY KEY,
  word_id integer NOT NULL REFERENCES words(id),
  word text NOT NULL
);

# --- !Downs

DROP TABLE taboo;
DROP TABLE words;
