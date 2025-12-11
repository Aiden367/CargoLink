import { Router } from "express";
import Customer from '../models/customer.js'
import { authenticateToken } from '../middleware/auth.js'
import { getCustomer } from '../middleware/recieveCustomer.js'
import { createClient } from 'redis';
import { redisClient } from '../server.js';
import { getVehicle } from '../middleware/recieveVehicle.js'
import Vehicle from '../models/vehicle.js'

const DEFAULT_EXPERIRATION = 3600
const router = Router()

router.post('/AddVehicle', async (req, res) => {
    const { VIN, name, type, year, make, model } = req.body;
    if (VIN == null || name == null || type == null || year == null || make == null || model == null) {
        return res.status(401).json({ message: "One of these fields are empty" })
    }
    const newVehicle = new Vehicle({
        VIN,
        name,
        type,
        year,
        make,
        model
    })
    try {
        const addedVehicle = await newVehicle.save()
        await redisClient.del("vehicles");
        res.status(201).json(addedVehicle)
    } catch (err) {
        res.status(400).json({ message: "cant save vehicle" })
    }
})

router.get('/GetAllVehicles', async (req,res) =>{
    try{
        const cached = await redisClient.get('vehicles')
        if(cached != null){
            return res.json(JSON.parse(cached));
        }
        const listOfVehicles = await Vehicle.find()
        if(listOfVehicles.length == 0){
            return res.status(401).json({message:"List of vehicles are empty"})
        }
        await redisClient.setEx(
            'vehicles',
            DEFAULT_EXPERIRATION,
            JSON.stringify(listOfVehicles)
        )
        res.json(listOfVehicles)
    }catch(err){
      res.status(500).json({message: "Could to retrieve all Vehicles"})
    }
})

router.patch('/EditVehicle/:vehicleId', getVehicle,async (req,res) =>{
    const recievedVehicle = req.Vehicle

    recievedVehicle.VIN = req.body.VIN;
    await recievedVehicle.save();
    res.json(recievedVehicle)
})


router.get('/SearchForVehicle/:vehicleId', getVehicle, async (req, res) => {
    res.json(req.vehicle);
});


export default router;