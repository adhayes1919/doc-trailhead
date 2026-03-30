import * as utils from '../../utils.js'

//TODO: should adding trip_members with med certs be one query or two?
//NOTE: def butchering this...
//NOTE: some of this could probably get cleaned up into case statements? 
//TODO: also check convention on making mega queries like these...
//
//also double users + double trip_members feels reallllly messy?
const _60_DAYS_IN_MS = 5184000000
const OPO_TRIPS_QUERY = `
    SELECT 
      trips.id,
      title,
      location,
      start_time,
      owner.name as owner,
      group_gear_approved,
      json_group_array(certs_med.expiration) as medcert_expirations,
      iif(vr.id IS NULL,
        'N/A',
        iif(vr.opo_approved IS NULL, 'pending', iif(vr.opo_approved = 0, 'denied', 'approved'))
      ) AS vr_status,
      iif(pc.rowid IS NULL,
        'N/A',
        iif(pc.opo_approved IS NULL, 'pending', iif(pc.opo_approved = 0, 'denied', 'approved'))
      ) AS pc_status,
      iif(trips.member_gear_approved IS NULL,
        iif(mg.count IS NULL, 'N/A', 'pending'),
        iif(trips.member_gear_approved = 1, 'approved', 'denied')) as mg_status,
      iif(trips.group_gear_approved IS NULL,
        iif(gg.count IS NULL, 'N/A', 'pending'),
        iif(trips.group_gear_approved = 1, 'approved', 'denied')) as gg_status
      
    FROM trips

    LEFT JOIN users as owner on owner.id = trips.owner 
    LEFT JOIN trip_pcard_requests AS pc ON pc.trip = trips.id

    LEFT JOIN trip_members ON trip_members.trip = trips.id AND trip_members.leader = 1

    LEFT JOIN users as leaders on leaders.id = trip_members.user
    LEFT JOIN certs_med on certs_med.user = leaders.id

    LEFT JOIN vehiclerequests AS vr ON vr.trip = trips.id
    LEFT JOIN (SELECT trip, count(*) as count FROM member_gear_requests GROUP BY trip) AS mg
      ON mg.trip = trips.id
    LEFT JOIN (SELECT trip, count(*) as count FROM group_gear_requests GROUP BY trip) AS gg
      ON gg.trip = trips.id
`

export function get(req, res) {
  const now = new Date()
  const pastTimeWindow = new Date(now.getTime() - _60_DAYS_IN_MS)

  /*
  //NOTE: put this in a reference somewhere
  const leaders = req.db.all('SELECT DISTINCT club_leaders.user from club_leaders INNER JOIN users ON club_leaders.user = users.id');
    const ids = [...new Set(leaders.map(obj => obj.user))];
  
  const placeholders = ids.map(() => '(?,?,?)').join(',');
  const medcertValues = ids.flatMap(id => [id, 'WFA', 1774569600000])
  req.db.prepare(`INSERT INTO certs_med (user, type, expiration) VALUES ${placeholders}`,).run(...medcertValues);
  */

  const past_trips = req.db.all(
    `${OPO_TRIPS_QUERY}
    WHERE start_time > @low_time
      AND start_time < @high_time
      AND (mg_status != 'N/A' OR gg_status != 'N/A' OR pc_status != 'N/A' OR vr_status != 'N/A')
    GROUP BY trips.id
    ORDER BY start_time DESC
      `,
    { low_time: pastTimeWindow.getTime(), high_time: now.getTime() }
  ).map(convertToRow)

    //console.log(past_trips);

      //NOTE:
  const future_trips = req.db.all(
    `${OPO_TRIPS_QUERY}
    WHERE start_time > ?
      AND (mg_status != 'N/A' OR gg_status != 'N/A' OR pc_status != 'N/A' OR vr_status != 'N/A')
    GROUP BY trips.id
    ORDER BY start_time ASC
      `,
    now.getTime()
  ).map(convertToRow)
    //console.log(future_trips);

  res.render('views/opo/trip-approvals.njk', { past_trips, future_trips })
}

function convertToRow(trip) {
  const now = new Date()
  //NOTE: this is messyyyyyy  
    //TODO: i actually hate this....
  const valid_medcerts = new Set(JSON.parse(trip.medcert_expirations).map(expiration_date => expiration_date >= now.getTime() ? 1 : 0))
  const medcert_status = valid_medcerts.size === 1 ? valid_medcerts.values().next().value : "pending" 

  return {
    id: trip.id,
    title: trip.title,
    owner: trip.owner,
    start_time_element: utils.getDatetimeElement(trip.start_time),
    medcert_status_element: utils.getBadgeImgElement(medcert_status),
    mg_status_element: utils.getBadgeImgElement(trip.mg_status),
    gg_status_element: utils.getBadgeImgElement(trip.gg_status),
    vr_status_element: utils.getBadgeImgElement(trip.vr_status),
    pc_status_element: utils.getBadgeImgElement(trip.pc_status)
  }
}
