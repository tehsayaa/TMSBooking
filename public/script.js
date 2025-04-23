document.addEventListener('DOMContentLoaded', () => {
    const locationSelect = document.getElementById('location');
    const floorSelect = document.getElementById('floor'); // Added floor select
    const roomSelect = document.getElementById('room');
    const timeslotSelect = document.getElementById('timeslot');
    const bookButton = document.getElementById('book-button');
    const messageArea = document.getElementById('message-area');

    // --- Helper Functions ---
    function clearSelect(selectElement, defaultOptionText) {
        selectElement.innerHTML = `<option value="">-- ${defaultOptionText} --</option>`;
        selectElement.disabled = true;
    }

    function populateSelect(selectElement, options) {
        clearSelect(selectElement, selectElement.options[0].text); // Keep default text
        if (options && options.length > 0) {
            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option;
                opt.textContent = option;
                selectElement.appendChild(opt);
            });
            selectElement.disabled = false;
        } else {
             selectElement.innerHTML = `<option value="">-- No options available --</option>`;
             selectElement.disabled = true;
        }
    }

    function showMessage(message, isSuccess) {
        messageArea.textContent = message;
        messageArea.className = isSuccess ? 'success' : 'error'; // Use classList for better practice
        // Optionally clear message after some time
        // setTimeout(() => messageArea.textContent = '', 5000);
    }

    // --- API Fetch Functions ---
    async function fetchLocations() {
        try {
            const response = await fetch('/api/locations');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const locations = await response.json();
            populateSelect(locationSelect, locations);
        } catch (error) {
            console.error('Error fetching locations:', error);
            showMessage('Failed to load locations.', false);
        }
    }

    async function fetchFloors(location) {
        clearSelect(floorSelect, 'Select Floor');
        clearSelect(roomSelect, 'Select Room');
        clearSelect(timeslotSelect, 'Select Time Slot');
        bookButton.disabled = true;
        if (!location) return;

        try {
            const response = await fetch(`/api/floors?location=${encodeURIComponent(location)}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const floors = await response.json();
            populateSelect(floorSelect, floors);
        } catch (error) {
            console.error('Error fetching floors:', error);
            showMessage(`Failed to load floors for ${location}.`, false);
        }
    }

     async function fetchRooms(location, floor) {
        clearSelect(roomSelect, 'Select Room');
        clearSelect(timeslotSelect, 'Select Time Slot');
        bookButton.disabled = true;
        if (!location || !floor) return;

        try {
            const response = await fetch(`/api/rooms?location=${encodeURIComponent(location)}&floor=${encodeURIComponent(floor)}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const rooms = await response.json();
            populateSelect(roomSelect, rooms);
        } catch (error) {
            console.error('Error fetching rooms:', error);
            showMessage(`Failed to load rooms for ${location} - ${floor}.`, false);
        }
    }

    async function fetchTimeSlots(room) { // Location and floor aren't strictly needed if room names are unique
        clearSelect(timeslotSelect, 'Select Time Slot');
        bookButton.disabled = true;
        if (!room) return;

        try {
            // We only need the room name for the timeslot endpoint as designed in index.js
            const response = await fetch(`/api/timeslots?room=${encodeURIComponent(room)}`);
             if (!response.ok) {
                const errorData = await response.json(); // Attempt to get error message from API
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const timeslots = await response.json();
            populateSelect(timeslotSelect, timeslots);
        } catch (error) {
            console.error('Error fetching timeslots:', error);
            showMessage(error.message || `Failed to load timeslots for ${room}.`, false);
             populateSelect(timeslotSelect, []); // Ensure dropdown shows "No options"
        }
    }

     async function bookRoom(location, floor, room, timeSlot) { // Added floor
        if (!location || !floor || !room || !timeSlot) { // Added floor check
            showMessage('Please select location, floor, room, and time slot.', false);
            return;
        }
        bookButton.disabled = true; // Disable button during request

        try {
            const response = await fetch('/api/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ location, floor, room, timeSlot }), // Added floor
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                 throw new Error(result.message || 'Booking failed.');
            }

            showMessage(result.message, true);
            // Optionally reset form or disable booked slot after success
            // fetchTimeSlots(location, room); // Re-fetch to potentially show updated availability

        } catch (error) {
            console.error('Error booking room:', error);
            showMessage(error.message || 'An error occurred during booking.', false);
        } finally {
             // Re-enable button only if a timeslot is still selected
             if (timeslotSelect.value) {
                 bookButton.disabled = false;
             }
        }
    }


    // --- Event Listeners ---
    locationSelect.addEventListener('change', (e) => {
        fetchFloors(e.target.value); // Fetch floors when location changes
    });

    floorSelect.addEventListener('change', (e) => {
        fetchRooms(locationSelect.value, e.target.value); // Fetch rooms when floor changes
    });

    roomSelect.addEventListener('change', (e) => {
        fetchTimeSlots(e.target.value); // Fetch timeslots when room changes
    });

     timeslotSelect.addEventListener('change', (e) => {
        bookButton.disabled = !e.target.value; // Enable book button only if a timeslot is selected
    });

    bookButton.addEventListener('click', () => {
        // Pass all selected values to bookRoom
        bookRoom(locationSelect.value, floorSelect.value, roomSelect.value, timeslotSelect.value);
    });

    // --- Initial Load ---
    fetchLocations();
});
