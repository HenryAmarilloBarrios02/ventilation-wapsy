import { GasModel } from '../models/DataModel.js'

export const getAllGases = async (req, res) => {
    try {
        const gases = await GasModel.findAll()

        return res.json(gases)

    } catch (error) {
        res.json({ message: error })
    }
}

export const getGas = async (req, res) => {
    try {
        const gasId = req.params.gasId

        const gas = await GasModel.findOne({
            where: { id: gasId }
        })

        if(!gas) {
            return res.json({ status: false, message: 'No existen datos del gas' })
        }

        return res.json(gas)
        
    } catch (error) {
        res.json({ message: error })
    }
}

export const createGas = async(req, res) => {
    try {
        
        const { name, unit, serie, category, type, min1, min2, max1, max2 } = req.body
        
        await GasModel.create({
            name: name,
            unit: unit,
            serie: serie,
            category: category,
            type: type,
            min1: min1, 
            min2: min2,
            max1: max1,
            max2: max2
        })

        return res.status(200).json({ status: true, message: 'Se ha registrado datos del nuevo gas' })
        
    } catch (error) {
        res.json({ message: error })
    }
}

export const updateGas = async(req, res) => {
    try {

        const { name, unit, serie, type, min1, min2, max1, max2 } = req.body

        const gasId = req.params.gasId

        const gas = await GasModel.findOne({
            where: { id: gasId }
        })

        if(!gas) {
            return res.json({ status: false, message: 'Datos del gas no encontrado' })
        }

        gas.name = name
        gas.unit = unit
        gas.serie = serie
        gas.type = type
        gas.min1 = min1
        gas.min2 = min2
        gas.max1 = max1
        gas.max2 = max2

        await gas.save()

        return res.status(200).json({ status: true, message: 'Los datos del gas se han actualizado' })
        
    } catch (error) {
        res.json({ message: error })
    }
}

export const deleteGas = async (req, res) => {
    try {

        const gasId = req.params.gasId

        const gas = await GasModel.findOne({
            where: { id: gasId }
        })

        if(!gas) {
            return res.json({ status: false, message: 'Datos del gas no encontrado' })
        } else {
            const gas = await GasModel.destroy({
                where: { id: gasId }
            })

            return res.status(200).json({ status: true, message: 'Se ha eliminado al gas' })
        }
        
    } catch (error) {
        res.json({ message: error })
    }
}

export const getAllGasesSensor = async (req, res) => {
    try {

        const gases = await GasModel.findAll({
            order: [
                ['id', 'ASC']
            ]
        })

        const name = gases.map(gas => gas.name)
        const unit = gases.map(gas => gas.unit)
        const serie = gases.map(gas => gas.serie)
        const type = gases.map(gas => gas.type)
        const min1 = gases.map(gas => gas.min1)
        const min2 = gases.map(gas => gas.min2)
        const max1 = gases.map(gas => gas.max1)
        const max2 = gases.map(gas => gas.max2)

        return res.status(200).json({ name: name, unit: unit, serie: serie, type: type, min1: min1, min2: min2, max1: max1, max2: max2 })

    } catch (error) {
        res.json({ message: error })
    }
}