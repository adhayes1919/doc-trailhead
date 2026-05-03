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
  const trips = req.db.all(tripsQuery, userId, now.getTime() - _24_HOURS_IN_MS)
    .map(trip => ({
      ...trip,
      iconPath: utils.getClubIcon(trip.club),
      time_element: utils.getDatetimeRangeElement(trip.start_time, trip.end_time)
    }))


    const medcertStatusEnum = Object.freeze({
        EXPIRED: "expired",
        EXPIRING_SOON: "expiring_soon",
        VALID: "valid",
        NOT_FOUND: "not_found", 
        NOT_LEADER: "not_leader" 
    });

    //let userMedcert;
    let medcertStatus = medcertStatusEnum.NOT_LEADER;
    let medcertExpirationDate; 

    if (can_create_trip) {
      const userMedcert = req.db.get('SELECT expiration from certs_med where user = ?', userId)
      const today = new Date().getTime()
      if (userMedcert) {
        //NOTE: slightly redundant for the sake of readability...
        const medcertExpiration = userMedcert.expiration
        medcertExpirationDate = dateFormat(userMedcert.expiration, 'mm-dd-yyyy')
        const medcertExpired = (today) > medcertExpiration
        const medcertExpiringSoon = (today + _60_DAYS_IN_MS) > medcertExpiration
        if (medcertExpired) {
          medcertStatus = medcertStatusEnum.EXPIRED
        } else if (medcertExpiringSoon) {
          medcertStatus = medcertStatusEnum.EXPIRING_SOON
        } else {
          medcertStatus = medcertStatusEnum.VALID
        }
      } else {
        //NOTE: ensure this isn't an issue for OPO...
        medcertStatus = medcertStatusEnum.NOT_FOUND
      }
    } 

  res.render('views/my-trips.njk', {
    trips,
    medcert_status : medcertStatus,
    medcert_expiration_date : medcertExpirationDate,
    can_create_trip
  })
}
