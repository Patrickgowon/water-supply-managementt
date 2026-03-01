// src/services/mapService.js

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

// Bokkos region boundaries
const BOKKOS_BOUNDS = {
  north: 9.3500,
  south: 9.3000,
  east: 9.0200,
  west: 8.9700
};

// Key locations in Bokkos
export const KEY_LOCATIONS = {
  plasuCampus: {
    name: 'PLASU Main Campus',
    lat: 9.3265,
    lng: 8.9947,
    type: 'university',
    address: 'Bokkos, Plateau State',
    priority: 'high'
  },
  bokkosHospital: {
    name: 'Bokkos General Hospital',
    lat: 9.3280,
    lng: 8.9910,
    type: 'hospital',
    address: 'Bokkos Town, Plateau State',
    priority: 'high'
  },
  waterDepot: {
    name: 'Central Water Depot',
    lat: 9.3200,
    lng: 8.9800,
    type: 'depot',
    address: 'Bokkos, Plateau State',
    capacity: '100000L'
  },
  bokkosMarket: {
    name: 'Bokkos Market',
    lat: 9.3240,
    lng: 8.9970,
    type: 'commercial',
    address: 'Bokkos Town',
    priority: 'medium'
  },
  mangarCommunity: {
    name: 'Mangar Community',
    lat: 9.3350,
    lng: 9.0050,
    type: 'residential',
    address: 'Mangar, Bokkos',
    priority: 'medium'
  },
  richaVillage: {
    name: 'Richa Village',
    lat: 9.3420,
    lng: 9.0120,
    type: 'residential',
    address: 'Richa, Bokkos',
    priority: 'low'
  },
  buturaCommunity: {
    name: 'Butura Community',
    lat: 9.3150,
    lng: 8.9850,
    type: 'residential',
    address: 'Butura, Bokkos',
    priority: 'medium'
  }
};

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Calculate estimated travel time based on distance and average speed
export const calculateTravelTime = (distance, averageSpeed = 30) => {
  return (distance / averageSpeed) * 60; // Returns time in minutes
};

// Geocode an address (convert address to coordinates)
export const geocodeAddress = async (address) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: data.results[0].formatted_address
      };
    }
    throw new Error('Address not found');
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// Reverse geocode (convert coordinates to address)
export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    return 'Address not found';
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return 'Unknown location';
  }
};

// Get directions between two points
export const getDirections = async (origin, destination, waypoints = []) => {
  try {
    const waypointsParam = waypoints.length > 0 
      ? `&waypoints=${waypoints.map(w => `${w.lat},${w.lng}`).join('|')}`
      : '';
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}${waypointsParam}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.status === 'OK') {
      const route = data.routes[0];
      const leg = route.legs[0];
      
      return {
        distance: leg.distance.text,
        duration: leg.duration.text,
        durationInSeconds: leg.duration.value,
        distanceInMeters: leg.distance.value,
        polyline: route.overview_polyline.points,
        steps: leg.steps.map(step => ({
          instruction: step.html_instructions,
          distance: step.distance.text,
          duration: step.duration.text
        }))
      };
    }
    throw new Error('Directions not found');
  } catch (error) {
    console.error('Directions error:', error);
    return null;
  }
};

// Search for places within Bokkos
export const searchPlaces = async (query, type = '') => {
  try {
    const location = '9.3265,8.9947'; // PLASU campus as center
    const radius = 10000; // 10km radius
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&keyword=${encodeURIComponent(query)}${type ? `&type=${type}` : ''}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.status === 'OK') {
      return data.results.map(place => ({
        id: place.place_id,
        name: place.name,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        address: place.vicinity,
        type: place.types[0],
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total
      }));
    }
    return [];
  } catch (error) {
    console.error('Place search error:', error);
    return [];
  }
};

// Get place details by ID
export const getPlaceDetails = async (placeId) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,formatted_address,formatted_phone_number,website,opening_hours,geometry&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.status === 'OK') {
      const place = data.result;
      return {
        name: place.name,
        address: place.formatted_address,
        phone: place.formatted_phone_number,
        website: place.website,
        rating: place.rating,
        hours: place.opening_hours?.weekday_text,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      };
    }
    return null;
  } catch (error) {
    console.error('Place details error:', error);
    return null;
  }
};

// Generate a static map URL
export const getStaticMapUrl = (center, zoom = 14, markers = []) => {
  let url = `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=${zoom}&size=600x400&key=${GOOGLE_MAPS_API_KEY}`;
  
  markers.forEach(marker => {
    url += `&markers=color:${marker.color || 'red'}|label:${marker.label || ''}|${marker.lat},${marker.lng}`;
  });
  
  return url;
};

// Check if coordinates are within Bokkos region
export const isWithinBokkos = (lat, lng) => {
  return (
    lat >= BOKKOS_BOUNDS.south &&
    lat <= BOKKOS_BOUNDS.north &&
    lng >= BOKKOS_BOUNDS.west &&
    lng <= BOKKOS_BOUNDS.east
  );
};

// Get all water sources in Bokkos
export const getWaterSources = () => {
  return [
    {
      id: 'ws1',
      name: 'Bokkos Central Borehole',
      lat: 9.3200,
      lng: 8.9800,
      type: 'borehole',
      capacity: '50000L/day',
      status: 'operational',
      waterQuality: 'excellent'
    },
    {
      id: 'ws2',
      name: 'Mangar Stream',
      lat: 9.3350,
      lng: 9.0050,
      type: 'surface',
      capacity: '100000L/day',
      status: 'operational',
      waterQuality: 'good'
    },
    {
      id: 'ws3',
      name: 'Richa Well Field',
      lat: 9.3420,
      lng: 9.0120,
      type: 'well',
      capacity: '30000L/day',
      status: 'maintenance',
      waterQuality: 'fair'
    }
  ];
};

// Get delivery zones in Bokkos
export const getDeliveryZones = () => {
  return [
    {
      id: 'zone1',
      name: 'Zone A - PLASU Campus',
      bounds: {
        north: 9.3300,
        south: 9.3230,
        east: 8.9980,
        west: 8.9910
      },
      priority: 'high',
      population: 5000
    },
    {
      id: 'zone2',
      name: 'Zone B - Bokkos Town',
      bounds: {
        north: 9.3320,
        south: 9.3220,
        east: 8.9950,
        west: 8.9850
      },
      priority: 'high',
      population: 8000
    },
    {
      id: 'zone3',
      name: 'Zone C - Mangar/Richa',
      bounds: {
        north: 9.3500,
        south: 9.3350,
        east: 9.0150,
        west: 9.0000
      },
      priority: 'medium',
      population: 3000
    }
  ];
};

// Optimize delivery route
export const optimizeRoute = (waypoints) => {
  if (waypoints.length < 2) return waypoints;
  
  // Simple greedy algorithm for route optimization
  // In production, use Google Maps Waypoint Optimization
  let optimized = [waypoints[0]];
  let remaining = waypoints.slice(1);
  
  while (remaining.length > 0) {
    const lastPoint = optimized[optimized.length - 1];
    let nearestIndex = 0;
    let shortestDistance = Infinity;
    
    remaining.forEach((point, index) => {
      const distance = calculateDistance(
        lastPoint.lat, lastPoint.lng,
        point.lat, point.lng
      );
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestIndex = index;
      }
    });
    
    optimized.push(remaining[nearestIndex]);
    remaining.splice(nearestIndex, 1);
  }
  
  return optimized;
};

export default {
  KEY_LOCATIONS,
  calculateDistance,
  calculateTravelTime,
  geocodeAddress,
  reverseGeocode,
  getDirections,
  searchPlaces,
  getPlaceDetails,
  getStaticMapUrl,
  isWithinBokkos,
  getWaterSources,
  getDeliveryZones,
  optimizeRoute
};