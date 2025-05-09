const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// --- Mock Data ---

// Locations and their floors
const locationsData = {
  'Hoà Lạc': ['1', '2'],
  'FPT Tower': ['10', '11', '12'],
  'Duy Tân': ['3', '4'],
  'Fville 1': ['0', '1'],
  'Fville 2': ['A1', 'B2'],
  'Fville 3': ['MH', 'C3']
};

// Rooms mapped by Location -> Floor -> Room Name
const roomsData = {
  'Hoà Lạc': {
    '1': ['HL-1F-Room A', 'HL-1F-Room B'],
    '2': ['HL-2F-Conf Hall']
  },
  'FPT Tower': {
    '10': ['FPTT-10F-Room 101', 'FPTT-10F-Room 102'],
    '11': ['FPTT-11F-Meeting Hub'],
    '12': ['FPTT-12F-Exec Suite', 'FPTT-12F-Room A', 'FPTT-12F-Room B', 'FPTT-12F-Conf Room', 'FPTT-12F-Training Room']
  },
  'Duy Tân': {
    '3': ['DT-3F-Room Alpha'],
    '4': ['DT-4F-Room Beta']
  },
  'Fville 1': {
    '0': ['FV1-GF-Innovation'],
    '1': ['FV1-1F-Collaboration']
  },
  'Fville 2': {
    'A1': ['FV2-A1-Synergy'],
    'B2': ['FV2-B2-Focus']
  },
  'Fville 3': {
    'MH': ['FV3-MH-Connect'],
    'C3': ['FV3-C3-Think Tank']
  }
};

// Time slots mapped directly by Room Name (assuming unique room names across floors/locations for simplicity)
const timeSlotsByRoom = {
  // Hoà Lạc
  'HL-1F-Room A': ['09:00 - 10:00', '10:00 - 11:00', '14:00 - 15:00'],
  'HL-1F-Room B': ['09:30 - 10:30', '11:00 - 12:00', '15:00 - 16:00'],
  'HL-2F-Conf Hall': ['10:00 - 12:00', '13:30 - 15:30'],
  // FPT Tower
  'FPTT-10F-Room 101': ['08:00 - 09:00', '10:00 - 11:00'],
  'FPTT-10F-Room 102': ['09:00 - 10:00', '13:00 - 14:00', '16:00 - 17:00'],
  'FPTT-11F-Meeting Hub': ['10:30 - 12:00', '14:00 - 15:30'],
  'FPTT-12F-Exec Suite': ['11:00 - 12:30', '14:00 - 16:00'],
  'FPTT-12F-Room A': ['11:00 - 12:00', '14:00 - 15:00', '16:00 - 17:00'],
  'FPTT-12F-Room B': ['09:00 - 10:00', '14:00 - 15:30'],
  'FPTT-12F-Conf Room': ['10:00 - 12:00', '14:00 - 16:00'],
  'FPTT-12F-Training Room': ['08:00 - 10:00', '14:00 - 17:00'],
  // Duy Tân
  'DT-3F-Room Alpha': ['09:00 - 11:00', '14:00 - 16:00'],
  'DT-4F-Room Beta': ['10:00 - 12:00', '13:00 - 15:00'],
  // Fville 1
  'FV1-GF-Innovation': ['09:00 - 10:30', '14:30 - 16:00'],
  'FV1-1F-Collaboration': ['10:00 - 11:30', '13:00 - 14:30'],
  // Fville 2
  'FV2-A1-Synergy': ['08:30 - 10:00', '15:00 - 16:30'],
  'FV2-B2-Focus': ['10:30 - 12:00', '13:30 - 15:00'],
  // Fville 3
  'FV3-MH-Connect': ['09:00 - 10:00', '11:00 - 12:00', '14:00 - 15:00'],
  'FV3-C3-Think Tank': ['10:00 - 11:30', '13:00 - 14:30', '15:30 - 17:00']
};

// Mock user data
const userLocations = {
  'ToanLM1': { location: 'FPT Tower', floor: '12' },
  'AnNH8': { location: 'Hoà Lạc', floor: '2' },
  'user123': { location: 'FPT Tower', floor: '10' },
  'admin456': { location: 'Hoà Lạc', floor: '1' },
  'dev789': { location: 'Fville 3', floor: 'C3' }
};

// Middleware to parse JSON bodies
app.use(express.json());
// Middleware to serve static files (HTML, CSS, JS for UI)
app.use(express.static(path.join(__dirname, 'public')));

// --- API Endpoints ---

// Get all locations
app.get('/api/locations', (req, res) => {
  res.json(Object.keys(locationsData));
});

// Get floors for a specific location
app.get('/api/floors', (req, res) => {
  const location = req.query.location;
  if (!location || !locationsData[location]) {
    return res.status(400).json({ error: 'Invalid or missing location parameter' });
  }
  res.json(locationsData[location] || []);
});

// Get rooms for a specific location and floor
app.get('/api/rooms', (req, res) => {
  const location = req.query.location;
  const floor = req.query.floor;

  if (!location || !locationsData[location]) {
    return res.status(400).json({ error: 'Invalid or missing location parameter' });
  }
  if (!floor || !locationsData[location].includes(floor)) {
    return res.status(400).json({ error: 'Invalid or missing floor parameter for the specified location' });
  }

  const rooms = roomsData[location]?.[floor] || [];
  const roomsWithTimeSlots = rooms.map(room => ({
    roomName: room,
    timeSlots: timeSlotsByRoom[room] || []
  }));
  res.json(roomsWithTimeSlots);
});

// Get available time slots for a specific room (room name is assumed unique)
app.get('/api/timeslots', (req, res) => {
  const room = req.query.room;
  // We don't strictly need location/floor if room names are unique, but could add validation
  if (!room) {
      return res.status(400).json({ error: 'Missing room parameter' });
  }
  if (!timeSlotsByRoom[room]) {
      // Check if the room exists at all in our data structure
      const roomExists = Object.values(roomsData).some(floors =>
          Object.values(floors).some(roomList => roomList.includes(room))
      );
      if (!roomExists) {
          return res.status(400).json({ error: 'Invalid room parameter' });
      }
      // Room exists but has no defined timeslots (unlikely with current mock data)
      return res.json([]);
  }

  // In a real app, you'd check availability based on existing bookings for this specific room
  // For this mock, we just return the predefined slots for the room
  res.json(timeSlotsByRoom[room] || []);
});

// Simulate booking a room
app.post('/api/book', (req, res) => {
  const { username, location, floor, room, timeSlot } = req.body;

  // Basic validation
  if (!username || !location || !floor || !room || !timeSlot) {
    return res.status(400).json({ error: 'Missing booking details (username, location, floor, room, timeSlot)' });
  }

   // Get user data
    const userData = userLocations[username];
    if (!userData) {
        return res.status(404).json({ error: 'User not found' });
    }

  // Add more specific validation (does location/floor/room/timeslot exist?)
  if (location !== userData.location ||
      floor !== userData.floor || // Compare with updated floor key
      !locationsData[location] ||
      !locationsData[location].includes(floor) ||
      !roomsData[location]?.[floor]?.includes(room) ||
      !timeSlotsByRoom[room]?.includes(timeSlot)) {
      return res.status(400).json({ error: 'Invalid booking details provided.' });
  }

  // In a real app, you would:
  // 1. Validate the location, room, and time slot exist and are available.
  // 2. Record the booking in a database.
  // 3. Handle potential conflicts (check if already booked).

  // Log a more prominent success message to the server console
  console.log(`\n✅ --- Successful Booking ---`);
  console.log(`   Username: ${username}`);
  console.log(`   Location: ${location}`);
  console.log(`   Floor:    ${floor}`);
  console.log(`   Room:     ${room}`);
  console.log(`   TimeSlot: ${timeSlot}`);
  console.log(`---------------------------\n`);

  // For the demo, always return success
  res.json({ success: true, message: `Successfully booked ${room} on floor ${floor} at ${location} for ${timeSlot} for user ${username}` });
});

// Get mock location/floor for a user
app.get('/api/user-location/:username', (req, res) => {
    const username = req.params.username;
    const userData = userLocations[username];

    if (!userData) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json(userData);
});


// --- Server Start ---
app.listen(port, () => {
  console.log(`Meeting room booking server listening at http://localhost:${port}`);
});
