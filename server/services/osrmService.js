import * as turf from '@turf/turf';

export const getRouteFromOsrm = async (startPoint, endPoint) => {
  const [startLng, startLat] = startPoint.coordinates;
  const [endLng, endLat] = endPoint.coordinates;

  const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Unable to fetch route from OSRM. Please check the coordinates and try again.');
  }

  const data = await response.json();
  const route = data.routes?.[0];

  if (!route) {
    throw new Error('No route found between the given points.');
  }

  return {
    geometry: route.geometry,
    distanceKm: Number((route.distance / 1000).toFixed(2)),
    durationSeconds: route.duration
  };
};

export const getPositionAlongRouteKm = (routeCoordinates, pointCoordinates) => {
  if (!routeCoordinates || routeCoordinates.length < 2) {
    return 0;
  }

  const routeLine = turf.lineString(routeCoordinates);
  const point = turf.point(pointCoordinates);
  const snapped = turf.nearestPointOnLine(routeLine, point);
  const startPoint = turf.point(routeCoordinates[0]);
  const routeSlice = turf.lineSlice(startPoint, turf.point(snapped.geometry.coordinates), routeLine);

  return Number(turf.length(routeSlice, { units: 'kilometers' }).toFixed(3));
};

export const getRideMatchInfo = (ride, pickup, drop) => {
  if (!ride?.route?.coordinates?.length) {
    return null;
  }

  const routeCoordinates = ride.route.coordinates;
  const pickupPosition = getPositionAlongRouteKm(routeCoordinates, pickup.coordinates);
  const dropPosition = getPositionAlongRouteKm(routeCoordinates, drop.coordinates);

  if (dropPosition < pickupPosition) {
    return null;
  }

  const pickupPoint = turf.point(pickup.coordinates);
  const dropPoint = turf.point(drop.coordinates);
  const routeLine = turf.lineString(routeCoordinates);
  const pickupNearest = turf.nearestPointOnLine(routeLine, pickupPoint);
  const dropNearest = turf.nearestPointOnLine(routeLine, dropPoint);

  const pickupDistanceKm = Number(turf.distance(pickupPoint, pickupNearest, { units: 'kilometers' }).toFixed(3));
  const dropDistanceKm = Number(turf.distance(dropPoint, dropNearest, { units: 'kilometers' }).toFixed(3));

  if (pickupDistanceKm > 0.5 || dropDistanceKm > 0.5) {
    return null;
  }

  const segmentKm = Number((dropPosition - pickupPosition).toFixed(3));
  const minFare = 35;
  const fare = Math.max(segmentKm * ride.ratePerKm, minFare);

  return {
    pickupAtKm: Number(pickupPosition.toFixed(3)),
    dropAtKm: Number(dropPosition.toFixed(3)),
    segmentKm,
    fare: Number(fare.toFixed(2))
  };
};
