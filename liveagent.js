const chatSessions = new Map();

function setupSocketHandlers(io) {
  io.on("connection", (socket) => {
    // Switch the chat from bot to a human receptionist
    socket.on("handover_req", async ({ chatId }) => {
      const session = chatSessions.get(chatId) || {
        mode: "BOT",
        agentId: null,
      };

      session.mode = "HUMAN";
      chatSessions.set(chatId, session);

      socket.join(`chat_${chatId}`);

      io.to(`chat_${chatId}`).emit("status_update", {
        mode: "HUMAN",
        message: "Connecting you to a hospital receptionist...",
      });

      // Let the receptionists know that a new inquiry has arrived
      io.to("receptionists_dashboard").emit("new_inquiry", { chatId });
    });

    // Assign the chat to a receptionist
    socket.on("claim_chat", async ({ chatId, agentId }) => {
      const session = chatSessions.get(chatId);

      if (!session || session.agentId !== null) {
        socket.emit("claim_error", {
          message: "This chat has already been assigned to another receptionist.",
        });
        return;
      }

      session.agentId = agentId;
      chatSessions.set(chatId, session);

      socket.join(`chat_${chatId}`);

      socket.emit("claim_success", { chatId });

      io.to(`chat_${chatId}`).emit("agent_assigned", { agentId });
    });

    // Handle messages sent by patients
    socket.on("client_message", ({ chatId, message, senderType }) => {
      const session = chatSessions.get(chatId);

      if (session && session.mode === "HUMAN") {
        // Send the message to the active chat instead of the bot
        io.to(`chat_${chatId}`).emit("incoming_message", {
          chatId,
          message,
          senderType,
        });
      } else {
        // Reply automatically while the chat is in bot mode
        socket.emit("bot_response", {
          message: 'Hello! How can our clinic assist you today? Type "Agent" for human support.',
        });
      }
    });

    socket.on("disconnect", () => {
      // Handle any cleanup needed when the user disconnects
    });
  });
}

module.exports = setupSocketHandlers;
