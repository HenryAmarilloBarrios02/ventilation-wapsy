import http from 'http'
import express from 'express'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import axios from 'axios'

import './database/db.js'
import { SafetyModel, VentilationModel, TiModel, NotificationModel, GasModel } from './models/DataModel.js'

import cors from 'cors'

import { config } from 'dotenv'
config()

import { generateGases } from './libs/generateGases.js'
generateGases()

import { Server } from 'socket.io'

import { Pool } from 'pg'

import safetyRoutes from './routes/safety.routes.js'
import gasRoutes from './routes/gas.routes.js'

const app = express()
const httpServer = http.createServer(app)

const corsOptions = {
    origin: '*',
}

const io = new Server(httpServer);

let USERS = {}
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`)
    USERS[socket.id] = socket
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`)
        delete USERS[socket.id]
    });
});

app.use(bodyParser.json({ limit: '2gb', extended: true }))
app.use(morgan('dev'))
app.use(cors(corsOptions))
app.use(express.json())

const routes = [
    safetyRoutes,
    gasRoutes
]

import modbusRTU from 'modbus-serial'
import mqtt from 'mqtt'
import { Gpio } from 'onoff'

const alert = new Gpio(27, 'out')
const red = new Gpio(22, 'out')
const blue = new Gpio(23, 'out')
const green = new Gpio(24, 'out')

const wapsi_system = new Gpio(25, 'in')

const ledGreen = () => {
    alert.writeSync(1)
    red.writeSync(1)
    blue.writeSync(1)
    green.writeSync(0)
}

const ledYellow = () => {
    alert.writeSync(1)
    red.writeSync(0)
    blue.writeSync(1)
    green.writeSync(0)
}

const ledRed = () => {
    alert.writeSync(0)
    red.writeSync(0)
    blue.writeSync(1)
    green.writeSync(1)
}

const options = {
    clientId: `${process.env.DEVICE_NAME} - ${Math.random().toString(16).substr(2, 8)}`,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD
}

const modbus = new modbusRTU()
modbus.connectRTUBuffered(process.env.COM_PORT, { baudRate: 9600 }, () => {
    console.log('Connected to IOT')
})

// COMENTAR CONEXION AL EMQX
// const client = mqtt.connect(process.env.MQTT_URL, options)
// client.on('connect', () => {
//     console.log('Connected to MQTT')
//     client.subscribe(`${process.env.SERIE}`)
// })

const fan = (v1, v2) => {
    modbus.setID(10)
    modbus.writeCoils(0, [v1, v2])
}
// const fan = (v1, v2, v3, v4) => {
//     modbus.setID(10)
//     modbus.writeCoils(0, [v1, v2, v3, v4])
// }

// setInterval( async() => {
//     modbus.setID(10)
//     const result = await modbus.readCoils(0, 6)
//     const data = result.data
//     fan(1, 1, 1, 1)
//     console.log(data)
// }, 1000)

class Device {
    constructor (name, value, und, status, msg, type, serie, min1, min2, max1, max2) {
        this.name = name
        this.value = value
        this.und = und
        this.status = status
        this.msg = msg
        this.type = type
        this.serie = serie
        this.min1 = min1
        this.min2 = min2
        this.max1 = max1
        this.max2 = max2
    }
}

class Controller {
    constructor (serie, mining, level , category, devices, timestamp) {
        this.serie = serie
        this.mining = mining
        this.level = level
        this.category = category
        this.devices = devices
        this.timestamp = timestamp
    }
}

class Notification {
    constructor (description, serie, value, name, msg, timestamp) {
        this.description = description
        this.serie = serie
        this.value = value
        this.name = name
        this.msg = msg
        this.timestamp = timestamp
    }
}

// SAFETY AND VENTILATION

// const nms = ['CO', 'NO2', 'CO2', 'O2', 'Temperatura', 'Humedad']
// const unds = ['ppm', 'ppm', '%vol', '%vol', '°C', '%RH']
// const series = ['S0001', 'S0002', 'S0003', 'S0004', 'S0005', 'S0006']
// const mins1 = [-1, -1, -1, 15, -20, 0]
// const mins2 = [-1, -1, -1, 19.5, -15, 20]
// const maxs1 = [25, 3, 2.5, 23.5, 40, 120]
// const maxs2 = [50, 5, 3, 25, 45, 150]

let statusNotification = false

// FUNCTION READING SENSOR
async function readModbusData(id, reg, len) {
    modbus.setID(id)
    try {
        const result = await modbus.readHoldingRegisters(reg, len)
        const data = result.data
        return data
    } catch (error) {
        console.log('ERROR - HORROR')
        return null
    }
}

// REAL TIME - TI

setInterval(async () => {

    let devices = []

    const data = await readModbusData(1, 0, 6);
    
    if (data) {
        for (let i = 0; i < 6; i++){

            if (i === 0) {
                const value = data[i]

                let AlarmStatus = 'Red'
                if (210 < value && value < 240) {
                    AlarmStatus = 'Green';
                } else if (240 < value && value < 250) {
                    AlarmStatus = 'Yellow';
                }

                let MsgStatus

                if (180 < value && value < 210) {
                    MsgStatus = 'ALERTA NIVEL BAJO'
                } else if (210 < value && value < 240) {
                    MsgStatus = 'OK'
                } else if (240 < value && value < 250) {
                    MsgStatus = 'ALERTA NIVEL ALTO'
                } else {
                    MsgStatus = 'ALERTA NIVEL MUY ALTO'
                }

                const device = new Device('Voltaje', value, 'V', AlarmStatus, MsgStatus, 'sa', 'S0007', 180, 210, 240, 250)
                devices = [...devices, device]

            } else if (i === 1) {
                const value = data[i]

                let AlarmStatus1 = 'Red'
                if (-15 < value && value < 40) {
                    AlarmStatus1 = 'Green';
                } else if (40 < value && value < 45) {
                    AlarmStatus1 = 'Yellow';
                }

                let MsgStatus1

                if (-20 < value && value < -15) {
                    MsgStatus1 = 'ALERTA NIVEL BAJO'
                } else if (-15 < value && value < 40) {
                    MsgStatus1 = 'OK'
                } else if (40 < value && value < 45) {
                    MsgStatus1 = 'ALERTA NIVEL ALTO'
                } else {
                    MsgStatus1 = 'ALERTA NIVEL MUY ALTO'
                }

                const device1 = new Device('Temperatura', value, '°C', AlarmStatus1, MsgStatus1, 'sa', 'S0008', -20, -15, 40, 45)
                devices = [...devices, device1]

            } else if (i === 2) {
                const value = data[i]

                let AlarmStatus2 = 'Red'
                if (20 < value && value < 120) {
                    AlarmStatus2 = 'Green';
                } else if (120 < value && value < 150) {
                    AlarmStatus2 = 'Yellow';
                }

                let MsgStatus2

                if (-1 < value && value < 20) {
                    MsgStatus2 = 'ALERTA NIVEL BAJO'
                } else if (20 < value && value < 120) {
                    MsgStatus2 = 'OK'
                } else if (120 < value && value < 150) {
                    MsgStatus2 = 'ALERTA NIVEL ALTO'
                } else {
                    MsgStatus2 = 'ALERTA NIVEL MUY ALTO'
                }

                const device2 = new Device('Humedad', value, '%RH', AlarmStatus2, MsgStatus2, 'sa', 'S0009', -1, 20, 120, 150)
                devices = [...devices, device2]

            } else if (i === 3) {
                const value = data[i]

                let AlarmStatus3
                let MsgStatus3

                if (-1 < value && value < 15) {
                    AlarmStatus3 = 'Red'
                    MsgStatus3 = 'BATERIA MUY BAJA'
                } else if (15 < value && value < 35) {
                    AlarmStatus3 = 'Yellow'
                    MsgStatus3 = 'BATERIA BAJA'
                } else {
                    AlarmStatus3 = 'Green'
                    MsgStatus3 = 'BATERIA CON RESPALDO'
                }

                const device3 = new Device('Bateria', value, '%', AlarmStatus3, MsgStatus3, 'sa', 'S0010', -1, 15, 35, 100)
                devices = [...devices, device3]

            } else if (i === 4) {
                const value = data[i]

                let AlarmStatus4
                let MsgStatus4

                if (value === 0) {
                    AlarmStatus4 = 'Green';
                    MsgStatus4 = 'PUERTA CERRADA'
                } else {
                    AlarmStatus4 = 'Red';
                    MsgStatus4 = 'PUERTA ABIERTA'
                }

                const device4 = new Device('Door Backup', value, '', AlarmStatus4, MsgStatus4, 'sd', 'S0011', '', '', '', '')
                devices = [...devices, device4]

            } else if (i === 5) {
                const value = data[i] / 1000

                let AlarmStatus5 = 'Red'
                if (0 < value && value < 20) {
                    AlarmStatus5 = 'Green';
                } else if (20 < value && value < 50) {
                    AlarmStatus5 = 'Yellow';
                }

                let MsgStatus5

                if (-1 < value && value < 0) {
                    MsgStatus5 = 'ALERTA NIVEL BAJO'
                } else if (0 < value && value < 20) {
                    MsgStatus5 = 'OK'
                } else if (20 < value && value < 50) {
                    MsgStatus5 = 'ALERTA NIVEL ALTO'
                } else {
                    MsgStatus5 = 'ALERTA NIVEL MUY ALTO'
                }

                const device5 = new Device('Corriente', value, 'A', AlarmStatus5, MsgStatus5, 'sa', 'S0012', -1, 0, 20, 50)
                devices = [...devices, device5]

                // WAPSI SYTEM READING

                const pruebita = wapsi_system.readSync()

                let AlarmStatus6
                let MsgStatus6

                if (pruebita === 0) {
                    AlarmStatus6 = 'Green';
                    MsgStatus6 = 'PUERTA CERRADA'
                } else {
                    AlarmStatus6 = 'Red';
                    MsgStatus6 = 'PUERTA ABIERTA'
                }

                const device6 = new Device('Door System', pruebita, '', AlarmStatus6, MsgStatus6, 'sd', 'S0013', '', '', '', '')
                devices = [...devices, device6]

                // SEND REALTIME - BROCKER - SERVER
                const controller = new Controller(process.env.SERIE, process.env.DEVICE_NAME, process.env.LEVEL, process.env.CATEGORY_TI, devices, new Date().getTime())
                // client.publish(process.env.TOPIC, JSON.stringify(controller))
            }
        }
    }
}, 3212);

// REAL TIME - SAFETY AND VENTILATION

let lowStatus = false
let highStatus = false
let lowCount = 0
let highCount = 0

const timeDelay = 30 * 15

let vent = {
    v1: false,
    v2: false
}

// REAL TIME - SAFETY AND VENTILATION

setInterval( async() => {

    const response = await axios.get(`${process.env.SERVER_URL}/wapsi`)
    const gases = response.data
    const nms = gases.name
    const unds = gases.unit
    const series = gases.serie
    const types = gases.type
    const mins1 = gases.min1
    const mins2 = gases.min2
    const maxs1 = gases.max1
    const maxs2 = gases.max2

    let devices1 = []
    let devices2 = []

    const data = await readModbusData(2, 1280, 30)

    if (data) {
        // SAFETY
        for (let i = 0; i < 4; i++) {
            const value = data[i * 5 + 1] / 10 ** data[i * 5 + 2]

            let AlarmStatus
            let MsgStatus
            if (mins1[i] < value && value <= mins2[i]) {
                AlarmStatus = 'Red'
                MsgStatus = 'ALERTA NIVEL BAJO'
            } else if (mins2[i] < value && value < maxs1[i]) {
                AlarmStatus = 'Green'
                MsgStatus = 'OK'
            } else if (maxs1[i] <= value && value < maxs2[i]) {
                AlarmStatus = 'Yellow'
                MsgStatus = 'ALERTA NIVEL ALTO'
            } else if (maxs2[i] <= value) {
                AlarmStatus = 'Red'
                MsgStatus = 'ALERTA NIVEL MUY ALTO'
            }

            const device1 = new Device(nms[i], value, unds[i], AlarmStatus, MsgStatus, types[i], series[i], mins1[i], mins2[i], maxs1[i], maxs2[i])
            devices1 = [...devices1, device1]
        }

        // VENTILATION
        for (let i = 4; i < 6; i++) {
            const value = data[i * 5 + 1] / 10 ** data[i * 5 + 2]

            let AlarmStatus
            let MsgStatus
            if (mins1[i] < value && value <= mins2[i]) {
                AlarmStatus = 'Red'
                MsgStatus = 'ALERTA NIVEL BAJO'
            } else if (mins2[i] < value && value < maxs1[i]) {
                AlarmStatus = 'Green'
                MsgStatus = 'OK'
            } else if (maxs1[i] <= value && value < maxs2[i]) {
                AlarmStatus = 'Yellow'
                MsgStatus = 'ALERTA NIVEL ALTO'
            } else if (maxs2[i] <= value) {
                AlarmStatus = 'Red'
                MsgStatus = 'ALERTA NIVEL MUY ALTO'
            }

            const device2 = new Device(nms[i], value, unds[i], AlarmStatus, MsgStatus, types[i], series[i], mins1[i], mins2[i], maxs1[i], maxs2[i])
            devices2 = [...devices2, device2]
        }
    }
    
    // SEND REALTIME - BROCKER - SERVER
    const controller1 = new Controller(process.env.SERIE, process.env.DEVICE_NAME, process.env.LEVEL, process.env.CATEGORY_SA, devices1, new Date().getTime())
    const controller2 = new Controller(process.env.SERIE, process.env.DEVICE_NAME, process.env.LEVEL, process.env.CATEGORY_VE, devices2, new Date().getTime())

    // client.publish(process.env.TOPIC, JSON.stringify(controller1))
    // client.publish(process.env.TOPIC, JSON.stringify(controller2))

    const highAlarm = devices1.filter(device => device.status === 'Red')
    const lowAlarm = devices1.filter(device => device.status === 'Yellow')

    if (lowAlarm.length == 0 && highAlarm.length > 0) {
        ledRed()
    } else if (lowAlarm.length > 0 && highAlarm.length == 0) {
        ledYellow()
    } else {
        ledGreen()
    }

    // console.log(lowAlarm, highAlarm, lowStatus, highStatus)

    if (!lowStatus && !highStatus) {
        fan(1, 1)
        vent = {v1: false, v2: false}
        console.log('VENTILACION APAGADA')
    }

    if (lowAlarm.lenght > 0 && !highStatus) {
        fan(1, 0)
        lowStatus = true
        lowCount = 0
        vent = {v1: true, v2: false}
        console.log('VENTILACION ENCENDIDA')
    } else {
        if (lowStatus && !highStatus) {
            lowCount++
            if (lowCount > timeDelay) {
                fan(0, 0)
                vent = {v1: false, v2: false}
                lowStatus = false
                lowCount = 0
                console.log('VENTILACION APAGADA')
            }
        }
    }

    if (highAlarm.lenght > 0){
        fan(1, 1)
        highStatus = true
        highCount = 0
        vent = {v1: true, v2: true}
        console.log('VENTILACION ENCENDIDA')
    } else {
        if (highStatus) {
            highCount++
            if (highCount > timeDelay) {
                fan(1, 0)
                highStatus = false
                lowStatus = true
                highCount = 0
                vent = {v1: true, v2: false}
            }
        }
    }

    for (let i in USERS) {
        USERS[i].emit('data', controller1)
    USERS[i].emit('vent', vent)
    }

    const alarmas = controller1.devices.filter(i => i.msg != 'OK')
    if (alarmas.length > 0) {
        if (!statusNotification) {
                alarmas.forEach(i => {

                        const notification = new Notification(
                                `Alarma ${controller1.mining}: En ${controller1.level}, sensor ${i.name} con el mensaje ${i.msg}`,
                                controller1.serie,
                                i.value,
                                i.name,
                                i.msg,
                                new Date().getTime()
                        )
                        
                        // SAVE LOCAL
                        NotificationModel.create({
                            description: notification.description,
                            serie: notification.serie,
                            value: notification.value,
                            name: notification.name,
                            msg: notification.msg,
                            timestamp: notification.timestamp
                        })

                        // SAVE SERVER - BROCKER
                        // client.publish(process.env.NOTIFY, JSON.stringify(notification))
                })
                statusNotification = true
        }
    } else {
        statusNotification = false
    }
}, 2212)

// SAVE DATA - TI

setInterval( async () => {

    let devices = []

    const data = await readModbusData(1, 0, 6);

    if (data) {
        for (let i = 0; i < 6; i++){

            if (i === 0) {
                const value = data[i]

                let AlarmStatus = 'Red'
                if (210 < value && value < 240) {
                    AlarmStatus = 'Green';
                } else if (240 < value && value < 250) {
                    AlarmStatus = 'Yellow';
                }

                let MsgStatus

                if (180 < value && value < 210) {
                    MsgStatus = 'ALERTA NIVEL BAJO'
                } else if (210 < value && value < 240) {
                    MsgStatus = 'OK'
                } else if (240 < value && value < 250) {
                    MsgStatus = 'ALERTA NIVEL ALTO'
                } else {
                    MsgStatus = 'ALERTA NIVEL MUY ALTO'
                }

                const device = new Device('Voltaje', value, 'V', AlarmStatus, MsgStatus, 'sa', 'S0007', 180, 210, 240, 250)
                devices = [...devices, device]

                // SAVE SERVER - BROCKER
                const controller1 = new Controller(process.env.SERIE, process.env.DEVICE_NAME, process.env.LEVEL, process.env.CATEGORY_TI, device, new Date().getTime())
                // client.publish(process.env.SAVE, JSON.stringify(controller1))

            } else if (i === 1) {
                const value = data[i]

                let AlarmStatus1 = 'Red'
                if (-15 < value && value < 40) {
                    AlarmStatus1 = 'Green';
                } else if (40 < value && value < 45) {
                    AlarmStatus1 = 'Yellow';
                }

                let MsgStatus1

                if (-20 < value && value < -15) {
                    MsgStatus1 = 'ALERTA NIVEL BAJO'
                } else if (-15 < value && value < 40) {
                    MsgStatus1 = 'OK'
                } else if (40 < value && value < 45) {
                    MsgStatus1 = 'ALERTA NIVEL ALTO'
                } else {
                    MsgStatus1 = 'ALERTA NIVEL MUY ALTO'
                }

                const device1 = new Device('Temperatura', value, '°C', AlarmStatus1, MsgStatus1, 'sa', 'S0008', -20, -15, 40, 45)
                devices = [...devices, device1]

                // SAVE SERVER - BROCKER
                const controller2 = new Controller(process.env.SERIE, process.env.DEVICE_NAME, process.env.LEVEL, process.env.CATEGORY_TI, device1, new Date().getTime())
                // client.publish(process.env.SAVE, JSON.stringify(controller2))

            } else if (i === 2) {
                const value = data[i]

                let AlarmStatus2 = 'Red'
                if (20 < value && value < 120) {
                    AlarmStatus2 = 'Green';
                } else if (120 < value && value < 150) {
                    AlarmStatus2 = 'Yellow';
                }

                let MsgStatus2

                if (-1 < value && value < 20) {
                    MsgStatus2 = 'ALERTA NIVEL BAJO'
                } else if (20 < value && value < 120) {
                    MsgStatus2 = 'OK'
                } else if (120 < value && value < 150) {
                    MsgStatus2 = 'ALERTA NIVEL ALTO'
                } else {
                    MsgStatus2 = 'ALERTA NIVEL MUY ALTO'
                }

                const device2 = new Device('Humedad', value, '%RH', AlarmStatus2, MsgStatus2, 'sa', 'S0009', -1, 20, 120, 150)
                devices = [...devices, device2]

                // SAVE SERVER - BROCKER
                const controller3 = new Controller(process.env.SERIE, process.env.DEVICE_NAME, process.env.LEVEL, process.env.CATEGORY_TI, device2, new Date().getTime())
                // client.publish(process.env.SAVE, JSON.stringify(controller3))

            } else if (i === 3) {
                const value = data[i]

                let AlarmStatus3
                let MsgStatus3

                if (-1 < value && value < 15) {
                    AlarmStatus3 = 'Red'
                    MsgStatus3 = 'BATERIA MUY BAJA'
                } else if (15 < value && value < 35) {
                    AlarmStatus3 = 'Yellow'
                    MsgStatus3 = 'BATERIA BAJA'
                } else {
                    AlarmStatus3 = 'Green'
                    MsgStatus3 = 'BATERIA CON RESPALDO'
                }

                const device3 = new Device('Bateria', value, '%', AlarmStatus3, MsgStatus3, 'sa', 'S0010', -1, 15, 35, 100)
                devices = [...devices, device3]

                // SAVE SERVER - BROCKER
                const controller4 = new Controller(process.env.SERIE, process.env.DEVICE_NAME, process.env.LEVEL, process.env.CATEGORY_TI, device3, new Date().getTime())
                // client.publish(process.env.SAVE, JSON.stringify(controller4))

            } else if (i === 4) {
                const value = data[i]

                let AlarmStatus4
                let MsgStatus4

                if (value === 0) {
                    AlarmStatus4 = 'Green';
                    MsgStatus4 = 'PUERTA CERRADA'
                } else {
                    AlarmStatus4 = 'Red';
                    MsgStatus4 = 'PUERTA ABIERTA'
                }

                const device4 = new Device('Door Backup', value, '', AlarmStatus4, MsgStatus4, 'sd', 'S0011', '', '', '', '')
                devices = [...devices, device4]

                // SAVE SERVER - BROCKER
                const controller5 = new Controller(process.env.SERIE, process.env.DEVICE_NAME, process.env.LEVEL, process.env.CATEGORY_TI, device4, new Date().getTime())
                // client.publish(process.env.SAVE, JSON.stringify(controller5))

            } else if (i === 5) {
                const value = data[i] / 1000

                let AlarmStatus5 = 'Red'
                if (0 < value && value < 20) {
                    AlarmStatus5 = 'Green';
                } else if (20 < value && value < 50) {
                    AlarmStatus5 = 'Yellow';
                }

                let MsgStatus5

                if (-1 < value && value < 0) {
                    MsgStatus5 = 'ALERTA NIVEL BAJO'
                } else if (0 < value && value < 20) {
                    MsgStatus5 = 'OK'
                } else if (20 < value && value < 50) {
                    MsgStatus5 = 'ALERTA NIVEL ALTO'
                } else {
                    MsgStatus5 = 'ALERTA NIVEL MUY ALTO'
                }

                const device5 = new Device('Corriente', value, 'A', AlarmStatus5, MsgStatus5, 'sa', 'S0012', -1, 0, 20, 50)
                devices = [...devices, device5]

                // SAVE SERVER - BROCKER
                const controller6 = new Controller(process.env.SERIE, process.env.DEVICE_NAME, process.env.LEVEL, process.env.CATEGORY_TI, device5, new Date().getTime())
                // client.publish(process.env.SAVE, JSON.stringify(controller6))

                // WAPSI SYTEM READING

                const pruebita = wapsi_system.readSync()

                let AlarmStatus6
                let MsgStatus6

                if (pruebita === 0) {
                    AlarmStatus6 = 'Green';
                    MsgStatus6 = 'PUERTA CERRADA'
                } else {
                    AlarmStatus6 = 'Red';
                    MsgStatus6 = 'PUERTA ABIERTA'
                }

                const device6 = new Device('Door System', pruebita, '', AlarmStatus6, MsgStatus6, 'sd', 'S0013', '', '', '', '')
                devices = [...devices, device6]

                // SAVE SERVER - BROCKER
                const controller7 = new Controller(process.env.SERIE, process.env.DEVICE_NAME, process.env.LEVEL, process.env.CATEGORY_TI, device6, new Date().getTime())
                // client.publish(process.env.SAVE, JSON.stringify(controller7))
            }
        }
    }

    const controller = new Controller(process.env.SERIE, process.env.DEVICE_NAME, process.env.LEVEL, process.env.CATEGORY_TI, devices, new Date().getTime())

    // SAVE LOCAL
    if (controller.devices.lenght > 0) {
        const ti = new TiModel({
            serie: process.env.SERIE,
            mining: process.env.DEVICE_NAME,
            level: process.env.LEVEL,
            category: process.env.CATEGORY_TI,
            voltaje: controller.devices[0].value,
            temperatura: controller.devices[1].value,
            humedad: controller.devices[2].value,
            bateria: controller.devices[3].value,
            door_backup: controller.devices[4].value,
            corriente: controller.devices[5].value,
            door_system: controller.devices[6].value,
            timestamp: controller.timestamp
        })

        await ti.save()
    }

}, 65005)

// SAVE DATA - SAFETY AND VENTILATION

setInterval( async() => {

    const response = await axios.get(`${process.env.SERVER_URL}/wapsi`)
    const gases = response.data
    const nms = gases.name
    const unds = gases.unit
    const series = gases.serie
    const types = gases.type
    const mins1 = gases.min1
    const mins2 = gases.min2
    const maxs1 = gases.max1
    const maxs2 = gases.max2

    let devices1 = []
    let devices2 = []

    const data = await readModbusData(2, 1280, 30)

    if (data) {
        // SAFETY
        for (let i = 0; i < 4; i++) {
            const value = data[i * 5 + 1] / 10 ** data[i * 5 + 2]

            let AlarmStatus
            let MsgStatus
            if (mins1[i] < value && value <= mins2[i]) {
                AlarmStatus = 'Red'
                MsgStatus = 'ALERTA NIVEL BAJO'
            } else if (mins2[i] < value && value < maxs1[i]) {
                AlarmStatus = 'Green'
                MsgStatus = 'OK'
            } else if (maxs1[i] <= value && value < maxs2[i]) {
                AlarmStatus = 'Yellow'
                MsgStatus = 'ALERTA NIVEL ALTO'
            } else if (maxs2[i] <= value) {
                AlarmStatus = 'Red'
                MsgStatus = 'ALERTA NIVEL MUY ALTO'
            }

            const device1 = new Device(nms[i], value, unds[i], AlarmStatus, MsgStatus, types[i], series[i], mins1[i], mins2[i], maxs1[i], maxs2[i])
            devices1 = [...devices1, device1]

            // SAVE SERVER - BROCKER
            const controller = new Controller(process.env.SERIE, process.env.DEVICE_NAME, process.env.LEVEL, process.env.CATEGORY_SA, device1, new Date().getTime())
            // client.publish(process.env.SAVE, JSON.stringify(controller))
        }

        // VENTILATION
        for (let i = 4; i < 6; i++) {
            const value = data[i * 5 + 1] / 10 ** data[i * 5 + 2]

            let AlarmStatus
            let MsgStatus
            if (mins1[i] < value && value <= mins2[i]) {
                AlarmStatus = 'Red'
                MsgStatus = 'ALERTA NIVEL BAJO'
            } else if (mins2[i] < value && value < maxs1[i]) {
                AlarmStatus = 'Green'
                MsgStatus = 'OK'
            } else if (maxs1[i] <= value && value < maxs2[i]) {
                AlarmStatus = 'Yellow'
                MsgStatus = 'ALERTA NIVEL ALTO'
            } else if (maxs2[i] <= value) {
                AlarmStatus = 'Red'
                MsgStatus = 'ALERTA NIVEL MUY ALTO'
            }

            const device2 = new Device(nms[i], value, unds[i], AlarmStatus, MsgStatus, types[i], series[i], mins1[i], mins2[i], maxs1[i], maxs2[i])
            devices2 = [...devices2, device2]

            // SAVE SERVER - BROCKER
            const controller = new Controller(process.env.SERIE, process.env.DEVICE_NAME, process.env.LEVEL, process.env.CATEGORY_SA, device2, new Date().getTime())
            // client.publish(process.env.SAVE, JSON.stringify(controller))
        }
    }

    // SAVE LOCAL
    const controller1 = new Controller(process.env.SERIE, process.env.DEVICE_NAME, process.env.LEVEL, process.env.CATEGORY_SA, devices1, new Date().getTime())
    const controller2 = new Controller(process.env.SERIE, process.env.DEVICE_NAME, process.env.LEVEL, process.env.CATEGORY_VE, devices2, new Date().getTime())

    if (controller1.devices.length > 0) {
        const safety = new SafetyModel({
            serie: process.env.SERIE,
            mining: process.env.DEVICE_NAME,
            level: process.env.LEVEL,
            category: process.env.CATEGORY_SA,
            CO: controller1.devices[0].value,
            NO2: controller1.devices[1].value,
            CO2: controller1.devices[2].value,
            O2: controller1.devices[3].value,
            timestamp: controller1.timestamp
        })

        await safety.save()
    }
    
    if (controller2.devices.length > 0) {
        const ventilation = new VentilationModel({
            serie: process.env.SERIE,
            mining: process.env.DEVICE_NAME,
            level: process.env.LEVEL,
            category: process.env.CATEGORY_VE,
            temperatura: controller2.devices[0].value,
            humedad: controller2.devices[1].value,
            timestamp: controller2.timestamp
        })

        await ventilation.save()
    }

}, 60005)

app.use('/', routes)

app.get('/', (req, res) => {
    res.send({ message: 'Welcome to the RASPBERRY' });
});

httpServer.listen(process.env.PORT, () => {
    console.log('Server up and running');
});