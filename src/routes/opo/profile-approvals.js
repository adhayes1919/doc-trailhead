export function get(req, res) {
  const leadership_requests = req.db.all(`
   SELECT club_leaders.rowid as req_id, users.name AS requester_name, clubs.name AS requested_item
   FROM club_leaders
   LEFT JOIN clubs ON clubs.id = club_leaders.club
   LEFT JOIN users ON users.id = club_leaders.user
   WHERE opo_approved = 0 and chair_approved = 1
   `)

  const chair_requests = req.db.all(`
   SELECT club_chairs.rowid as req_id, users.name AS requester_name, clubs.name AS requested_item
   FROM club_chairs
   LEFT JOIN clubs ON clubs.id = club_chairs.club
   LEFT JOIN users ON users.id = club_chairs.user
   WHERE opo_approved = 0
   `)

  const cert_requests = req.db.all(`
   SELECT certs_vehicles.rowid as req_id, users.name AS requester_name, cert AS requested_item
   FROM certs_vehicles
   LEFT JOIN users ON users.id = certs_vehicles.user
   WHERE opo_approved = 0`)

  return res.render('views/opo/profile-approvals.njk', { leadership_requests, cert_requests, chair_requests })
}

export function approveLeadershipRequest(req, res) {
  const rowid = req.params.req_id
  if (!rowid) return res.sendStatus(400)
  req.db.run('UPDATE club_leaders SET opo_approved = 1 WHERE rowid = ?', rowid)
  return res.status(200).send('')
}

export function denyLeadershipRequest(req, res) {
  const rowid = req.params.req_id
  if (!rowid) return res.sendStatus(400)
  req.db.run('DELETE FROM club_leaders WHERE rowid = ? AND opo_approved = 0', rowid)
  return res.status(200).send('')
}

export function approveCertRequest(req, res) {
  const rowid = req.params.req_id
  if (!rowid) return res.sendStatus(400)
  req.db.run('UPDATE certs_vehicles SET opo_approved = 1 WHERE rowid = ?', rowid)
  return res.status(200).send('')
}

export function denyCertRequest(req, res) {
  const rowid = req.params.req_id
  if (!rowid) return res.sendStatus(400)
  req.db.run('DELETE FROM certs_vehicles WHERE rowid = ? AND opo_approved = 0', rowid)
  return res.status(200).send('')
}

export function approveChairRequest(req, res) {
  const rowid = req.params.req_id
  if (!rowid) return res.sendStatus(400)
  req.db.run('UPDATE club_chairs SET opo_approved = 1 WHERE rowid = ?', rowid)
  return res.status(200).send('')
}

export function denyChairRequest(req, res) {
  const rowid = req.params.req_id
  if (!rowid) return res.sendStatus(400)
  req.db.run('DELETE FROM club_chairs WHERE rowid = ? AND opo_approved = 0', rowid)
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

  return res.render('views/opo/user-search-results.njk', { users })
}
