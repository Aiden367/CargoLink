import Vehicle from "../models/vehicle.js";


export const getVehicle = async (req, res, next) => {
    try {
        const foundVehicle = await Vehicle.findOne({ vehicleId: req.params.vehicleId })
        if (foundVehicle == null) {
            return res.status(400).json({ message: "Could not find vehicle" })
        }
        req.vehicle = foundVehicle
        next();
    } catch (err) {
        res.status(500).json({ message: "Could not retrieve vehicle" })
    }
}

export default getVehicle;
