require('dotenv').config()
const express = require('express') //common js
const path = require('path')  //path
const configViewEngine = require('./config/viewengine')
const webRouter = require('./routes/web')

const app = express() //app express
const port = process.env.PORT || 8080 //port
const hostname = process.env.HOST_NAME

//config req.body 
app.use(express.json()) //for json
app.use(express.urlencoded({extended:true})) //for form data
//config template engine
configViewEngine(app)

//khai bao route
app.use('/',webRouter)

app.listen(port,hostname, () => {
  console.log(`Example app listening on port ${port}`)
})