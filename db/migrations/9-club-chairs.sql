CREATE TABLE club_chairs (
  user INTEGER REFERENCES users ON DELETE CASCADE ON UPDATE CASCADE,
  club INTEGER REFERENCES clubs ON DELETE RESTRICT ON UPDATE CASCADE,
  opo_approved INTEGER NOT NULL DEFAULT FALSE,
  chair_since INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user, club)
) STRICT;

alter table club_leaders add column chair_approved INTEGER NOT NULL DEFAULT FALSE;

-- for consistency...
alter table club_leaders rename column is_approved to opo_approved;
alter table certs_vehicles RENAME is_approved to opo_approved;
alter table vehiclerequests rename is_approved to opo_approved;
alter table trip_pcard_requests rename column is_approved to opo_approved;
