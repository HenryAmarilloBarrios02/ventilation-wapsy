import { SafetyModel } from '../models/DataModel.js'

export const getAllSafeties = async (req, res) => {
    try {
        const safeties = await SafetyModel.findAll()

        return res.json(safeties)

    } catch (error) {
        res.json({ message: error })
    }
}

export const getSafety = async (req, res) => {
    try {
        const safetyId = req.params.safetyId

        const safety = await SafetyModel.findOne({
            where: { id: safetyId }
        })

        if(!safety) {
            return res.json({ status: false, message: 'No existen datos del safety' })
        }

        return res.json(safety)
        
    } catch (error) {
        res.json({ message: error })
    }
}

export const deleteSafety = async (req, res) => {
    try {

        const safetyId = req.params.safetyId

        const safety = await SafetyModel.findOne({
            where: { id: safetyId }
        })

        if(!safety) {
            return res.json({ status: false, message: 'Datos del safety no encontrado' })
        } else {
            const safety = await SafetyModel.destroy({
                where: { id: safetyId }
            })

            return res.status(200).json({ status: true, message: 'Se ha eliminado al safety' })
        }

    } catch (error) {
        res.json({ message: error })
    }
}