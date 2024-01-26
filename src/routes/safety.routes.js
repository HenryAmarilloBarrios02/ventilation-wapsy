import express from 'express'
import { getData, createData, deleteData } from '../controllers/SafetyController.js'

const router = express.Router()

router.get('/safety', getData)
router.post('/safety', createData)
router.delete('/safety/:id', deleteData)

export default router