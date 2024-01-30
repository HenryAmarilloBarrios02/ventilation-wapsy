import { GasModel } from '../models/DataModel.js'

export const generateGases = async (req, res) => {
    try {

        const count = await GasModel.count()

        if (count === 0) {
            const gasData = [
                { name: 'CO', unit: 'ppm', category: 'SAFETY', serie: 'S0001', type: 'sa', min1: -1, min2: -1, max1: 25, max2: 50 },
                { name: 'NO2', unit: 'ppm', category: 'SAFETY', serie: 'S0002', type: 'sa', min1: -1, min2: -1, max1: 3, max2: 5 },
                { name: 'CO2', unit: '%vol', category: 'SAFETY', serie: 'S0003', type: 'sa', min1: -1, min2: -1, max1: 2.5, max2: 3 },
                { name: 'O2', unit: '%vol', category: 'SAFETY', serie: 'S0004', type: 'sa', min1: 15, min2: 19.5, max1: 23.5, max2: 25 },

                { name: 'Temperatura', unit: '°C', category: 'VENTILATION', serie: 'S0005', type: 'sa', min1: -20, min2: -15, max1: 40, max2: 45 },
                { name: 'Humedad', unit: '%RH', category: 'VENTILATION', serie: 'S0006', type: 'sa', min1: 0, min2: 20, max1: 120, max2: 150 },
                { name: 'Flujometro', unit: 'm/s', category: 'VENTILATION', serie: 'S0007', type: 'sa', min1: -1, min2: -1, max1: 100, max2: 120},

                { name: 'Voltaje', unit: 'V', category: 'TI', serie: 'S0008', type: 'sa', min1: 180, min2: 210, max1: 240, max2: 250 },
                { name: 'Temperatura', unit: '°C', category: 'TI', serie: 'S0009', type: 'sa', min1: -20, min2: -15, max1: 40, max2: 45 },
                { name: 'Humedad', unit: '%RH', category: 'TI', serie: 'S0010', type: 'sa', min1: 0, min2: 20, max1: 120, max2: 150 },
                { name: 'Bateria', unit: '%', category: 'TI', serie: 'S0011', type: 'sa', min1: -1, min2: 15, max1: 35, max2: 100 },
                { name: 'Door Backup', unit: '', category: 'TI', serie: 'S0012', type: 'sd', min1: 0, min2: 0, max1: 0, max2: 0 },
                { name: 'Corriente', unit: 'A', category: 'TI', serie: 'S0013', type: 'sa', min1: -1, min2: 0, max1: 20, max2: 50 },
                { name: 'Door System', unit: '', category: 'TI', serie: 'S0014', type: 'sd', min1: 0, min2: 0, max1: 0, max2: 0 },
            ]

            await GasModel.bulkCreate(gasData)
        }
        
    } catch (error) {
        res.json({ message: error })
    }
}