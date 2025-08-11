const express = require('express') //common js
require('dotenv').config()
const app = express() //app express
const port = process.env.PORT || 8080//port

//config template engine 
app.set('views','./src/views')
app.set('view engine', 'ejs')

//khai bao route
app.get('/', (req, res) => {
  res.render('sample.ejs')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})