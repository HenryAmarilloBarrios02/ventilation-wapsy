import express from 'express'
import { getAllNotifications, getNotification, deleteNotification } from '../controllers/NotificationController.js'

const router = express.Router()

router.get('/notification', getAllNotifications)

router.get('/notification/:notificationId', getNotification)

router.delete('/notification/:notificationId', deleteNotification)

export default router