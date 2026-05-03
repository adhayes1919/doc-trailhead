import * as utils from '../utils.js'
import dateFormat from 'dateformat'

const _60_DAYS_IN_MS = 5184000000

export function get(req, res) {
  const userId = req.user
  const _24_HOURS_IN_MS = 86400000
  const now = new Date()

  const is_leader_query = `SELECT 1 as is_leader
                           FROM club_leaders 
                           WHERE user = ? and opo_approved = TRUE`

  const is_leader = req.db.get(is_leader_query, userId)?.is_leader === 1

  const can_create_trip = res.locals.is_opo || is_leader

  const tripsQuery = `
        SELECT 
          trips.id, title, location, start_time, end_time, description, leader,
          coalesce(clubs.name, 'None') as club
        FROM trip_members
        JOIN trips ON trips.id = trip_members.trip
        LEFT JOIN clubs ON trips.club = clubs.id
        WHERE 
          trip_members.user = ?
          AND end_time > ?
        ORDER BY start_time ASC
      `
    //TODO: prolly not needed to do db.all here...
    //NOTE: most of this can prolly get cleaned up?

  const trips = req.db.all(tripsQuery, userId, now.getTime() - _24_HOURS_IN_MS)
    .map(trip => ({
      ...trip,
      iconPath: utils.getClubIcon(trip.club),
      time_element: utils.getDatetimeRangeElement(trip.start_time, trip.end_time)
    }))

    let medcertExpiringSoon = false
    let userMedcert = null
    let medcertExpirationDate = null

    if (can_create_trip) {
      const userMedcert = req.db.all('SELECT expiration from certs_med where user = ?', userId)
      const today = new Date().getTime()
      if (userMedcert[0]) {
        console.log(`userMedcert: ${userMedcert}`)
          medcertExpiringSoon = (today + _60_DAYS_IN_MS) > userMedcert[0].expiration 
          medcertExpirationDate = dateFormat(userMedcert[0].expiration, 'mm-dd-yyyy')
      } else{
          //TODO: all leaders should have a medcert

      }
    } 

  res.render('views/my-trips.njk', {
    trips,
    medcert_expiring_soon : medcertExpiringSoon,
    medcert_expiration_date : medcertExpirationDate,
    can_create_trip
  })
}
//medcert_expiration_date : dateFormat(userMedcert[0].expiration, 'mm-dd-yyyy'),
