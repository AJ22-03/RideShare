import express from 'express';
import * as turf from '@turf/turf';

import Ride from '../models/Ride.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import { protect, authorize, requireVerified } from '../middleware/auth.js';
import { getRouteFromOsrm, getRideMatchInfo } from '../services/osrmService.js';

const router = express.Router();

const parseCoordinate = (value, label) => {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`${label} must be a valid number.`);
  }
  return number;
};

const normalizePoint = (point, label) => {
  if (!point || !Array.isArray(point.coordinates) || point.coordinates.length !== 2) {
    throw new Error(`${label} is required as [lng, lat].`);
  }

  return {
    type: 'Point',
    coordinates: [
      parseCoordinate(point.coordinates[0], `${label} longitude`),
      parseCoordinate(point.coordinates[1], `${label} latitude`)
    ]
  };
};

const ensureSeatAvailable = async (ride, pickupAtKm, dropAtKm) => {
  const bookings = await Booking.find({
    ride: ride._id,
    status: { $in: ['accepted', 'ongoing'] }
  }).select('pickupAtKm dropAtKm');

  let occupiedSeats = 0;

  for (const booking of bookings) {
    const earlier = Math.min(booking.pickupAtKm, booking.dropAtKm);
    const later = Math.max(booking.pickupAtKm, booking.dropAtKm);
    const requestedStart = Math.min(pickupAtKm, dropAtKm);
    const requestedEnd = Math.max(pickupAtKm, dropAtKm);

    const overlaps = requestedStart < later && requestedEnd > earlier;
    if (overlaps) {
      occupiedSeats += 1;
    }
  }

  return occupiedSeats < ride.seatsAvailable;
};

router.post('/', protect, authorize('driver'), requireVerified, async (req, res) => {
  try {
    const { vehicleId, vehicleType, from, to, departureTime, ratePerKm, seatsAvailable, notes } = req.body;

    if (!vehicleId || !from || !to || !departureTime || !ratePerKm || !seatsAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle, origin, destination, departure time, price and seats are required.'
      });
    }

    const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: req.user._id });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found for your account.'
      });
    }

    const normalizedFrom = normalizePoint(from, 'From');
    const normalizedTo = normalizePoint(to, 'To');

    const routeData = await getRouteFromOsrm(normalizedFrom, normalizedTo);
    const ride = await Ride.create({
      driver: req.user._id,
      vehicle: vehicle._id,
      vehicleType: vehicleType || vehicle.vehicleType,
      from: {
        place: from.place || 'Origin',
        location: normalizedFrom
      },
      to: {
        place: to.place || 'Destination',
        location: normalizedTo
      },
      route: {
        type: 'LineString',
        coordinates: routeData.geometry.coordinates
      },
      departureTime: new Date(departureTime),
      seatsAvailable: Number(seatsAvailable),
      ratePerKm: Number(ratePerKm),
      routeDistanceKm: routeData.distanceKm,
      status: 'open',
      isVerified: req.user.driverVerified,
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      ride: {
        id: ride._id,
        driver: ride.driver,
        vehicleType: ride.vehicleType,
        from: ride.from,
        to: ride.to,
        departureTime: ride.departureTime,
        seatsAvailable: ride.seatsAvailable,
        ratePerKm: ride.ratePerKm,
        routeDistanceKm: ride.routeDistanceKm,
        status: ride.status
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/search', protect, async (req, res) => {
  try {
    const { pickupLng, pickupLat, dropLng, dropLat, date, vehicleType, maxPrice } = req.query;

    if (!pickupLng || !pickupLat || !dropLng || !dropLat) {
      return res.status(400).json({
        success: false,
        message: 'pickupLng, pickupLat, dropLng and dropLat are required.'
      });
    }

    const pickup = {
      type: 'Point',
      coordinates: [
        parseCoordinate(pickupLng, 'Pickup longitude'),
        parseCoordinate(pickupLat, 'Pickup latitude')
      ]
    };

    const drop = {
      type: 'Point',
      coordinates: [
        parseCoordinate(dropLng, 'Drop longitude'),
        parseCoordinate(dropLat, 'Drop latitude')
      ]
    };

    const filter = {
      status: 'open',
      departureTime: { $gte: new Date(date || new Date().toISOString()) }
    };

    if (vehicleType) {
      filter.vehicleType = vehicleType;
    }

    const rides = await Ride.find(filter).populate('driver', 'name averageRating ratingCount').populate('vehicle', 'brand model numberPlate seats');
    const results = [];

    for (const ride of rides) {
      const match = getRideMatchInfo(ride, pickup, drop);
      if (!match) continue;

      if (maxPrice && match.fare > Number(maxPrice)) continue;

      const driver = ride.driver || { name: 'Driver' };
      const result = {
        rideId: ride._id,
        driver: {
          id: driver._id,
          name: driver.name,
          rating: driver.averageRating || 0,
          ratingCount: driver.ratingCount || 0
        },
        vehicle: ride.vehicle || {},
        vehicleType: ride.vehicleType,
        departureTime: ride.departureTime,
        routeDistanceKm: ride.routeDistanceKm,
        pickupAtKm: match.pickupAtKm,
        dropAtKm: match.dropAtKm,
        segmentKm: match.segmentKm,
        fare: match.fare,
        from: ride.from,
        to: ride.to,
        route: ride.route
      };

      results.push(result);
    }

    res.json({
      success: true,
      count: results.length,
      results: results.sort((a, b) => a.fare - b.fare)
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:rideId/request', protect, authorize('rider'), async (req, res) => {
  try {
    const { rideId } = req.params;
    const { pickup, drop } = req.body;

    if (!pickup || !drop) {
      return res.status(400).json({
        success: false,
        message: 'pickup and drop coordinates are required.'
      });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found.'
      });
    }

    const normalizedPickup = normalizePoint(pickup, 'Pickup');
    const normalizedDrop = normalizePoint(drop, 'Drop');
    const match = getRideMatchInfo(ride, normalizedPickup, normalizedDrop);

    if (!match) {
      return res.status(400).json({
        success: false,
        message: 'The requested pickup and drop are not valid on this route or are in the wrong direction.'
      });
    }

    const seatAvailable = await ensureSeatAvailable(ride, match.pickupAtKm, match.dropAtKm);
    if (!seatAvailable) {
      return res.status(409).json({
        success: false,
        message: 'No seats are available for that segment.'
      });
    }

    const booking = await Booking.create({
      ride: ride._id,
      rider: req.user._id,
      driver: ride.driver,
      pickup: normalizedPickup,
      drop: normalizedDrop,
      pickupAtKm: match.pickupAtKm,
      dropAtKm: match.dropAtKm,
      segmentKm: match.segmentKm,
      fare: match.fare,
      status: 'pending',
      paymentMethod: 'cash',
      paymentStatus: 'unpaid'
    });

    res.status(201).json({
      success: true,
      message: 'Ride request created successfully.',
      booking: {
        id: booking._id,
        status: booking.status,
        fare: booking.fare,
        segmentKm: booking.segmentKm,
        pickupAtKm: booking.pickupAtKm,
        dropAtKm: booking.dropAtKm
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:rideId/accept/:bookingId', protect, authorize('driver'), async (req, res) => {
  try {
    const { rideId, bookingId } = req.params;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found.'
      });
    }

    if (String(ride.driver) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You can only accept bookings on your own ride.'
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking || String(booking.ride) !== String(rideId)) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found for this ride.'
      });
    }

    const seatAvailable = await ensureSeatAvailable(ride, booking.pickupAtKm, booking.dropAtKm);
    if (!seatAvailable) {
      return res.status(409).json({
        success: false,
        message: 'This booking would exceed the segment seat capacity.'
      });
    }

    booking.status = 'accepted';
    await booking.save();

    res.json({
      success: true,
      message: 'Ride request accepted.',
      booking: {
        id: booking._id,
        status: booking.status,
        rider: booking.rider,
        fare: booking.fare
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/:rideId/bookings', protect, async (req, res) => {
  const { rideId } = req.params;
  const ride = await Ride.findById(rideId);

  if (!ride) {
    return res.status(404).json({
      success: false,
      message: 'Ride not found.'
    });
  }

  const bookings = await Booking.find({ ride: rideId })
    .populate('rider', 'name email')
    .populate('driver', 'name');

  res.json({
    success: true,
    rideId,
    bookings
  });
});

export default router;
