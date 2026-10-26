const express = require("express");
const router = express.Router();

// Temporary database example
const Database = {
  async findByRequestId(requestId) {
    return null;
  },

  async createBooking(data) {
    return {
      id: "app_999",
      ...data,
      status: "CONFIRMED",
    };
  },
};

router.post("/api/book-appointment", async (req, res) => {
  try {
    const { requestId, patientPhoneNo, doctorId, slotTime } = req.body;

    // Check if all details are provided
    if (!requestId || !patientPhoneNo || !doctorId || !slotTime) {
      return res.status(400).json({
        error: "Please provide all required booking details.",
      });
    }

    // Check if this request was already processed
    const booking = await Database.findByRequestId(requestId);

    if (booking) {
      return res.status(200).json({
        message: "This appointment has already been booked.",
        appointment: booking,
      });
    }

    // Save the new appointment
    const newBooking = await Database.createBooking({
      requestId,
      patientPhoneNo,
      doctorId,
      slotTime,
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({
      message: "Appointment booked successfully.",
      appointment: newBooking,
    });
  } catch (error) {
    // Handle cases where the selected slot is already booked
    if (error.message === "DUPLICATE_SLOT" || error.code === "23505") {
      return res.status(409).json({
        error: "Sorry, this time slot is already booked. Please choose another slot.",
      });
    }

    console.error("Failed to book appointment:", error);

    return res.status(500).json({
      error: "Something went wrong while booking the appointment.",
    });
  }
});

module.exports = router;
