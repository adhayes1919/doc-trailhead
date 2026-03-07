-- TODO: each of these needs to have better data handling 
-- also eventully change type and class. maybe add descriptions/tags?
CREATE TABLE gear (
  id INTEGER primary key,
  name TEXT UNIQUE NOT NULL,
  class TEXT NOT NULL,
  type TEXT,
  quantity integer NOT NULL,
  active INTEGER DEFAULT TRUE
) STRICT;

