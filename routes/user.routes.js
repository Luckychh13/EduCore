import express from 'express'
import { changeUserPassword, deleteUserAccount, getCurrentUserProfile, loginUser, logoutUser, registerUser, updateUserProfile } from '../controllers/user.controller.js'
import { isAuthenticated } from '../middleware/auth.middleware.js'
import upload from '../utils/multer.js'
import { validateLogin, validatePasswordChange, validateRegister } from '../middleware/validation.middleware.js'

const router = express.Router()

router.post('/register',validateRegister ,registerUser)
router.post('/login',validateLogin ,loginUser)
router.post('/logout', logoutUser)

router.get('/profile', isAuthenticated, getCurrentUserProfile)
router.patch('/profile', isAuthenticated,upload.single('avatar') ,updateUserProfile)

router.patch('/change-password',isAuthenticated,validatePasswordChange,changeUserPassword)

router.delete('/account', isAuthenticated,deleteUserAccount)

export default router