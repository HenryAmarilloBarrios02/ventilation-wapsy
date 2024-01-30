import { NotificationModel } from '../models/DataModel.js'

export const getAllNotifications = async (req, res) => {
    try {
        const notifications = await NotificationModel.findAll()

        return res.json(notifications)

    } catch (error) {
        res.json({ message: error })
    }
}

export const getNotification = async (req, res) => {
    try {
        const notificationId = req.params.notificationId

        const notification = await NotificationModel.findOne({
            where: { id: notificationId }
        })

        if(!notification) {
            return res.json({ status: false, message: 'No existen datos de la notification' })
        }

        return res.json(notification)
        
    } catch (error) {
        res.json({ message: error })
    }
}

export const deleteNotification = async (req, res) => {
    try {

        const notificationId = req.params.notificationId

        const notification = await NotificationModel.findOne({
            where: { id: notificationId }
        })

        if(!notification) {
            return res.json({ status: false, message: 'Datos de la notification no encontrada' })
        } else {
            const notification = await NotificationModel.destroy({
                where: { id: notificationId }
            })

            return res.status(200).json({ status: true, message: 'Se ha eliminado la notification' })
        }

    } catch (error) {
        res.json({ message: error })
    }
}