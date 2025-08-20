const express = require('express')
const router = express.Router()
const {
    getHomePage,
    getHaoTuHoc,
    postCreateUser
}=require('../controllers/homeController')

router.get('/',  getHomePage)
router.get('/haotuhoc',getHaoTuHoc)

router.post('/create-user',postCreateUser)
module.exports = router