const express = require('express')
const router = express.Router()
const {
    getHomePage,
    getHaoTuHoc,
    getCreateForm,
    getEditForm,
    postCreateUser
}=require('../controllers/homeController')

router.get('/',  getHomePage)
router.get('/haotuhoc',getHaoTuHoc)
router.get('/create',getCreateForm)
router.get('/edit/:id',getEditForm)
router.post('/create-user',postCreateUser)
module.exports = router