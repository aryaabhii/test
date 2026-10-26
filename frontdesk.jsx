import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:1000";

export default function FrontDeskChat({ chatId, agentId }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL);
    socketRef.current = socket;

    socket.emit("join_chat", { chatId });

    // Add new messages without showing duplicates
    const handleIncomingMessage = (msg) => {
      setMessages((prev) => {
        const alreadyExists = prev.some((item) => item.id === msg.id);

        if (alreadyExists) return prev;

        return [...prev, msg];
      });
    };

    // Update the message once the server confirms it
    const handleMessageConfirmed = ({ tempId, serverId }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...msg, id: serverId, status: "sent" } : msg)),
      );
    };

    socket.on("incoming_message", handleIncomingMessage);
    socket.on("message_confirmed", handleMessageConfirmed);

    // Remove listeners when the chat changes or the component closes
    return () => {
      socket.off("incoming_message", handleIncomingMessage);
      socket.off("message_confirmed", handleMessageConfirmed);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [chatId]);

  const handleSend = (e) => {
    e.preventDefault();

    const messageText = inputText.trim();

    if (!messageText || !socketRef.current) return;

    const tempId = `temp_${Date.now()}`;

    const newMessage = {
      id: tempId,
      chatId,
      senderType: "AGENT",
      message: messageText,
      status: "sending",
    };

    // Show the message immediately
    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    // Send the message to the server
    socketRef.current.emit("agent_message", {
      chatId,
      tempId,
      agentId,
      message: messageText,
    });
  };

  return (
    <div className="chat-container">
      <div className="messages-feed">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.senderType.toLowerCase()}`}>
            <span>{msg.message}</span>

            {msg.status === "sending" && <small className="status"> (Sending...)</small>}

            {msg.status === "sent" && <small className="status"> (Sent)</small>}
          </div>
        ))}
      </div>

      <form onSubmit={handleSend}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your reply to patient..."
        />

        <button type="submit">Send</button>
      </form>
    </div>
  );
}
