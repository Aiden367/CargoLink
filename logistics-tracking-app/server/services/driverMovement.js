// services/driverMovement.js
import { redisClient } from '../server.js';
import Driver from '../models/Driver.js';
import Order from '../models/order.js';

const MOVEMENT_INTERVAL = 3000; // Update every 3 seconds
const SPEED_KM_PER_HOUR = 40; // 40 km/h average speed
const STEP_DISTANCE_KM = (SPEED_KM_PER_HOUR / 3600) * (MOVEMENT_INTERVAL / 1000); // Distance per update

const movingDrivers = new Map(); // Store interval IDs

// Calculate bearing between two points
function calculateBearing(lat1, lon1, lat2, lon2) {
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);

    return ((θ * 180) / Math.PI + 360) % 360;
}

// Calculate destination point given distance and bearing
function calculateDestination(lat, lon, distance, bearing) {
    const R = 6371; // Earth's radius in km
    const δ = distance / R; // Angular distance
    const θ = (bearing * Math.PI) / 180;
    const φ1 = (lat * Math.PI) / 180;
    const λ1 = (lon * Math.PI) / 180;

    const φ2 = Math.asin(
        Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
    );

    const λ2 = λ1 + Math.atan2(
        Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
        Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
    );

    return {
        latitude: (φ2 * 180) / Math.PI,
        longitude: (λ2 * 180) / Math.PI
    };
}

// Calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in km
}

// Start moving driver towards customer
export async function startDriverMovement(driverId, customerLat, customerLng) {
    try {
        // Stop any existing movement for this driver
        stopDriverMovement(driverId);

        // Get driver's current location
        const position = await redisClient.geoPos("drivers", driverId);
        if (!position || !position[0]) {
            console.error(`Driver ${driverId} not found in Redis`);
            return;
        }

        let currentLat = parseFloat(position[0].latitude);
        let currentLng = parseFloat(position[0].longitude);

        // Update driver status in database
        await Driver.findOneAndUpdate(
            { DriverId: driverId },
            { isMoving: true, isAvailable: false }
        );

        console.log(`Started movement for driver ${driverId} to (${customerLat}, ${customerLng})`);

        // Create interval to move driver
        const intervalId = setInterval(async () => {
            try {
                // Get current position
                const currentPos = await redisClient.geoPos("drivers", driverId);
                if (!currentPos || !currentPos[0]) {
                    stopDriverMovement(driverId);
                    return;
                }

                currentLat = parseFloat(currentPos[0].latitude);
                currentLng = parseFloat(currentPos[0].longitude);

                // Calculate distance to destination
                const distanceRemaining = calculateDistance(
                    currentLat,
                    currentLng,
                    customerLat,
                    customerLng
                );

                console.log(`Driver ${driverId} distance remaining: ${distanceRemaining.toFixed(3)} km`);

                // Check if arrived (within 50 meters)
                if (distanceRemaining < 0.05) {
                    console.log(`Driver ${driverId} arrived at destination`);
                    
                    // Set exact destination coordinates
                    await redisClient.geoAdd("drivers", {
                        longitude: customerLng,
                        latitude: customerLat,
                        member: driverId
                    });

                    // Update driver in database
                    await Driver.findOneAndUpdate(
                        { DriverId: driverId },
                        { 
                            isMoving: false,
                            location: {
                                type: 'Point',
                                coordinates: [customerLng, customerLat]
                            }
                        }
                    );

                    // Update order status to in_transit
                    await Order.findOneAndUpdate(
                        { driverId: driverId, status: 'assigned' },
                        { status: 'in_transit' }
                    );

                    stopDriverMovement(driverId);
                    return;
                }

                // Calculate bearing to customer
                const bearing = calculateBearing(currentLat, currentLng, customerLat, customerLng);

                // Calculate next position
                const stepDistance = Math.min(STEP_DISTANCE_KM, distanceRemaining);
                const nextPos = calculateDestination(currentLat, currentLng, stepDistance, bearing);

                // Update position in Redis
                await redisClient.geoAdd("drivers", {
                    longitude: nextPos.longitude,
                    latitude: nextPos.latitude,
                    member: driverId
                });

                // Update driver in database
                await Driver.findOneAndUpdate(
                    { DriverId: driverId },
                    {
                        location: {
                            type: 'Point',
                            coordinates: [nextPos.longitude, nextPos.latitude]
                        }
                    }
                );

            } catch (err) {
                console.error(`Error moving driver ${driverId}:`, err);
                stopDriverMovement(driverId);
            }
        }, MOVEMENT_INTERVAL);

        movingDrivers.set(driverId, intervalId);

    } catch (err) {
        console.error(`Error starting driver movement:`, err);
    }
}

// Stop driver movement
export function stopDriverMovement(driverId) {
    const intervalId = movingDrivers.get(driverId);
    if (intervalId) {
        clearInterval(intervalId);
        movingDrivers.delete(driverId);
        console.log(`Stopped movement for driver ${driverId}`);
        
        // Update driver status
        Driver.findOneAndUpdate(
            { DriverId: driverId },
            { isMoving: false }
        ).catch(err => console.error('Error updating driver status:', err));
    }
}

// Stop all driver movements (for cleanup)
export function stopAllDriverMovements() {
    movingDrivers.forEach((intervalId, driverId) => {
        clearInterval(intervalId);
        console.log(`Stopped movement for driver ${driverId}`);
    });
    movingDrivers.clear();
}

export default {
    startDriverMovement,
    stopDriverMovement,
    stopAllDriverMovements
};