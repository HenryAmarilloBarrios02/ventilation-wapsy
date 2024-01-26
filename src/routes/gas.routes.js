import express from 'express'

import { getAllGases, getGas, createGas, updateGas, deleteGas, getAllGasesSensor } from '../controllers/GasController.js'

const router = express.Router()

router.get('/gas', getAllGases)

router.get('/gas/:gasId', getGas)

router.post('/gas', createGas)

router.put('/gas/:gasId', updateGas)

router.delete('/gas/:gasId', deleteGas)

router.get('/wapsi', getAllGasesSensor)

export default router