export function get(req, res) {
  const active_clubs = req.db.all('SELECT id, name FROM clubs where active = 1 ORDER BY name')
  const inactive_clubs = req.db.all('SELECT id, name FROM clubs where active = 0 ORDER BY name')
  return res.render('views/opo/manage-clubs.njk', { active_clubs, inactive_clubs })
}

// insert new club
// TODO: make case insensitive
export function post(req, res) {
  const { name } = req.body
  req.db.run(
    `INSERT INTO clubs (name, active) 
     VALUES (?, 1)
     ON CONFLICT(name) 
     DO UPDATE SET active = 1;`,
    [name]
  ) //TODO: this could have a better warning
  return get(req, res)
}

//TODO: this can probably become one function with a condtion?
export function makeInactive(req, res) {
  const id = req.params.id
  req.db.run('UPDATE clubs SET active = 0 WHERE id = ?', id)
  const club = req.db.get(`select name, id from clubs where id = ?`, id)


  const activeButton = `
    <button
        class="action approve"
        hx-confirm="Make ${club.name} an active club?"
        hx-patch="/opo/manage-clubs/make-active/${club.id}"
        hx-target="this"
        hx-swap="outerHTML"
      >Make Active</button>`

  return res.send(activeButton).status(200)
}

export function makeActive(req, res) {
  const id = req.params.id
  req.db.run('UPDATE clubs SET active = 1 WHERE id = ?', id)

    //TODO: this feels like a reallllllly ugly solution?
  const club = req.db.get(`select name, id from clubs where id = ?`, id)

  const inactiveButton = `
      <button
        class="action deny"
        hx-confirm="Make ${club.name} an inactive club?"
        hx-patch="/opo/manage-clubs/make-inactive/${club.id}"
        hx-target="this"
        hx-swap="outerHTML"
      >Make Inactive</button>`

  return res.send(inactiveButton).status(200)
}
