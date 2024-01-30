import express from 'express'
import { getAllSafeties, getSafety, deleteSafety } from '../controllers/SafetyController.js'

const router = express.Router()

router.get('/safety', getAllSafeties)

router.get('/safety/:safetyId', getSafety)

router.delete('/safety/:safetyId', deleteSafety)

export default router