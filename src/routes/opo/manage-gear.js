export function get(req, res) {
  const gear = req.db.all('SELECT id, name, class, type, quantity FROM gear where active = 1')
  return res.render('views/opo/manage-gear.njk', { gear })
}

export function post(req, res) {
    //TODO: had to rename class to gearclass here cause of JS conflict. should probbbbably rename elsewhere...
  const { name, gearclass, type, quantity } = req.body
  req.db.run(
    `INSERT INTO gear (name, class, type, quantity, active) 
     VALUES (?, ?, ?, ?, 1) 
     ON CONFLICT(name) 
     DO UPDATE SET active = 1;`,
    [name, gearclass, type, quantity]
  )
  return get(req, res)
}

export function del(req, res) {
    console.log("called delete?")
  const id = req.params.id
    console.log(req.params)
  req.db.run('UPDATE gear SET active = 0 WHERE id = ?', id)
  return res.send('').status(200)
}
