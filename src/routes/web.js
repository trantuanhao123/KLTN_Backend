const express = require('express')
const router = express.Router()
const {
    getHomePage,
    getHaoTuHoc,
    getCreateForm,
    getEditForm,
    postCreateUser,
    postEditUser,
    getDeleteForm,
    postDeleteUser
}=require('../controllers/homeController')

router.get('/',  getHomePage)
router.get('/haotuhoc',getHaoTuHoc)
router.get('/create',getCreateForm)
router.get('/edit/:id',getEditForm)
router.post('/create-user',postCreateUser)
router.post('/edit-user',postEditUser)
router.get('/delete/:id',getDeleteForm)
router.post('/delete-user',postDeleteUser)
module.exports = router