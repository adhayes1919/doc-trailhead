import dateFormat from 'dateformat'

export function get(req, res) {
  const userId = parseInt(req.user)
  const userChairIn = req.db.all(`
    SELECT 
        clubs.id,
        clubs.name
    FROM club_chairs
    LEFT JOIN clubs ON clubs.id = club_chairs.club
    WHERE user = ? AND is_approved = 1
    ORDER BY name
  `, userId)
    const clubIds = userChairIn.map(({ id }) => id);

    //TODO: note the medcert naming inconsistencies
  const leadership_requests = req.db.all(`
   SELECT 
    club_leaders.rowid as req_id, 
    users.name AS requester_name, 
    clubs.name AS requested_item, 
    clubs.id as clubid,
    certs_med.type as medcert_type,
    certs_med.expiration as medcert_expiration
   FROM club_leaders
   LEFT JOIN clubs ON clubs.id = club_leaders.club
   LEFT JOIN users ON users.id = club_leaders.user
   LEFT JOIN certs_med ON certs_med.user = club_leaders.user
   WHERE is_approved = 0 AND clubid in (${clubIds.join(',')})
   `).map(row => {
      if (!row.medcert_expiration) {
        row.medcert_expiration = null;
        return row;
      }
      const date = new Date(row.medcert_expiration);
      if (isNaN(date.getTime())) {
        row.medcert_expiration = null;
        return row;
      }
      row.medcert_expiration = dateFormat(date, "mm-dd-yyyy");
      return row;
      })

  return res.render('views/chair/profile-approvals.njk', { leadership_requests })
}

// TODO: Add is_approved = 0 to all these WHERE statements
// That way it's only possible to change something that the interface is displaying
export function approveLeadershipRequest(req, res) {
  const rowid = req.params.req_id
  if (!rowid) return res.sendStatus(400)
  req.db.run('UPDATE club_leaders SET is_approved = 1 WHERE rowid = ?', rowid)
  return res.status(200).send('')
}

export function denyLeadershipRequest(req, res) {
  const rowid = req.params.req_id
  if (!rowid) return res.sendStatus(400)
  req.db.run('DELETE FROM club_leaders WHERE rowid = ?', rowid)
  return res.status(200).send('')
}

export function approveCertRequest(req, res) {
  const rowid = req.params.req_id
  if (!rowid) return res.sendStatus(400)
  req.db.run('UPDATE certs_vehicles SET is_approved = 1 WHERE rowid = ?', rowid)
  return res.status(200).send('')
}

export function denyCertRequest(req, res) {
  const rowid = req.params.req_id
  if (!rowid) return res.sendStatus(400)
  req.db.run('DELETE FROM certs_vehicles WHERE rowid = ?', rowid)
  return res.status(200).send('')
}

export function searchUsers(req, res) {
  const search = req.body.search
  if (!search?.length || search.length < 1) {
    return res.send('<div id=search-results class=notice>Results will display here</div>')
  }
  const searchTerm = `%${search}%`
  const users = req.db.all('SELECT id, name, email FROM users WHERE name like ?', searchTerm)

  if (users.length > 100) {
    return res.send('<div id=search-results class=notice>Too many results, keep typing to narrow them</div>')
  }

  return res.render('views/chair/user-search-results.njk', { users })
}
