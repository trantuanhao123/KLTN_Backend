require('dotenv').config()
const express = require('express') //common js
const path = require('path')  //path
const configViewEngine = require('./config/viewengine')
const webRouter = require('./routes/web')
const mysql = require('mysql2')

const app = express() //app express
const port = process.env.PORT || 8080 //port
const hostname = process.env.HOST_NAME

//config template engine
configViewEngine(app)

//khai bao route
app.use('/',webRouter)

//test connection 
const connection = mysql.createConnection({
  host: 'localhost',
  port: '3307', //default:3306
  user: 'root',
  password: '123456',
  database: 'haotuhoc'
})
connection.query(
  'SELECT * FROM Users',
  function(err,result,fields){
    console.log(">>> result= ",result)
    console.log(">>> fields= ",fields)
  }
)
app.listen(port,hostname, () => {
  console.log(`Example app listening on port ${port}`)
})