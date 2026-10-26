## Problem 1: Doctor Slot Booking

**Problem:** Rapid clicks and simultaneous requests sometimes created duplicate appointments or allowed two patients to book the same doctor's time slot.

**Solution:**
- Prevented duplicate bookings by checking `requestId` and returning the existing appointment if the same request was submitted again.
- Added a unique database constraint on `(doctorId, slotTime)` to ensure that only one patient could book a particular doctor's time slot. Handled booking conflicts and returned a `409 Conflict` response.

## Problem 2: Live Agent Handover

**Problem:** The chatbot continued replying after a human agent joined the conversation, and multiple receptionists could try to accept the same inquiry.

**Solution:**
- Added a `BOT`/`HUMAN` mode to control whether the chatbot or a human agent handled the conversation.
- Used an atomic database update to ensure that only one receptionist could claim a conversation at a time.

## Problem 3: Front-Desk Chat Screen

**Problem:** Unstable internet connections caused duplicate socket listeners and repeated messages. Sending a message also felt slow because users received no immediate feedback.

**Solution:**
- Added `socket.off()` cleanup in React's `useEffect` to prevent duplicate event listeners during reconnections and component cleanup.
- Made messages appear instantly with a temporary ID and a "Sending..." status, then updated the status to "Sent" after receiving confirmation from the server.

## Problem 4: Sending Notifications to 200,000 Users

**Problem:** Processing 200,000 notifications in a single operation put too much load on the server, increased memory usage, and caused request timeouts.

**Solution:**
- Moved notification processing to a background queue using Redis and BullMQ, allowing the API to respond immediately while the notifications were processed separately.
- Processed notifications in smaller batches using background workers to control server load and track delivery status.