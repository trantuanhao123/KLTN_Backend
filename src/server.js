const express = require('express') //common js
require('dotenv').config()
const app = express() //app express
const port = process.env.PORT || 8080 //port
const path = require('path') //path
//config template engine 
app.set('views',path.join(__dirname,'views'))
app.set('view engine', 'ejs')

//config static files
app.use(express.static(path.join(__dirname,'public')))

//khai bao route
app.get('/', (req, res) => {
  res.render('sample.ejs')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})