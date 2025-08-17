const express = require('express')
const router = express.Router()
const {
    getHomePage,
    getHaoTuHoc
}=require('../controllers/homeController')

router.get('/',  getHomePage)
router.get('/haotuhoc',getHaoTuHoc)
module.exports = router