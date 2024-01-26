import { SafetyModel } from '../models/DataModel.js'

export const getData = async (req, res) => {
    try {
        const data = await SafetyModel.findAll()
        res.json(data)
    } catch (error) {
        res.json({ message: error })
    }
}

export const createData = async (req, res) => {
    try {
        const data = await SafetyModel.create({
            name: req.body.name,
            lastname: req.body.lastname,
        })
        
    } catch (error) {
        res.json({ message: error })
    }
}

export const deleteData = async (req, res) => {
    try {
        const data = await SafetyModel.destroy({
            where: {
                id: req.params.id
            }
        })
        res.json(data)
    } catch (error) {
        res.json({ message: error })
    }
}