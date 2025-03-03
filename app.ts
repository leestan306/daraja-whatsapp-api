type OrderMessageType = {
  from: string;
  id: string;
  timestamp: number;
  type: string;
  order: {
    catalog_id: string;
    text: string;
    product_items: {
      product_retailer_id: string;
      quantity: number;
      item_price: number;
      currency: string;
    }[];
  };
};

import express, { Request, Response } from "express";
import axios from "axios";
import bodyParser from "body-parser";
import * as dotenv from "dotenv";
dotenv.config();
// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON and URL-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Environment variables
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "your_verify_token";
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "your_access_token";
const PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID || "your_phone_number_id";

/**
 * Webhook verification endpoint
 * This is used by WhatsApp to verify the webhook URL.
 */
app.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

/**
 * Handle incoming messages from WhatsApp
 */
// @ts-ignore
app.post("/webhook", async (req: Request, res: Response) => {
  const body = req.body;

  console.log("Incoming message:", JSON.stringify(body, null, 2));

  // Parse the message
  const entry = body.entry?.[0];
  if (!entry) {
    return res.status(200).end();
  }

  const changes = entry.changes?.[0];
  if (!changes) {
    return res.status(200).end();
  }

  const value = changes.value;
  const messaging = value.messages?.[0];

  if (messaging) {
    const senderPhoneNumber = messaging.from;
    const messageText = messaging.text?.body;
    const order = changes.value?.messages?.[0]?.order;

    if (messageText) {
      console.log(`Received message from ${senderPhoneNumber}: ${messageText}`);
      await sendMessage(senderPhoneNumber, `You said: ${messageText}`);
    } else if (order) {
      await handleOrderEvent(changes.value?.messages?.[0]);
    }
  }

  res.status(200).end();
});

/**
 * Function to send a message via WhatsApp API
 */
async function sendMessage(to: string, text: string): Promise<void> {
  try {
    const url = `https://graph.facebook.com/v16.0/${PHONE_NUMBER_ID}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to,
      text: { body: text },
    };

    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    console.log("Message sent successfully:", response.data);
  } catch (error) {
    // Safely handle the error
    if (axios.isAxiosError(error)) {
      console.error(
        "Axios Error:",
        error.response?.data || error.message || "Unknown error"
      );
    } else {
      console.error("Unexpected Error:", error);
    }
  }
}

/**
 * Handle order (cart checkout) events
 * @param value Order message type
 */
async function handleOrderEvent(value: OrderMessageType) {
  const customerPhoneNumber = value.from; // Adjust based on your e-commerce platform's payload
  const cartDetails = value.order; // Adjust based on your e-commerce platform's payload
  console.log("Order received:", JSON.stringify(value, null, 2));
  const cartSummary = generateCartSummary(cartDetails);
  await sendMessage(customerPhoneNumber, `New Order Received:\n${cartSummary}`);
}

async function handleMpesaPaymentPushStk(value: OrderMessageType) {
  const customerPhoneNumber = value.from; // Adjust based on your e-commerce platform's payload
}

/**
 * Generate a summary of the cart details
 */
function generateCartSummary(cart: OrderMessageType["order"]): string {
  let summary = "";
  cart.product_items.forEach((item) => {
    summary += `• ${item.item_price} x ${item.quantity} = Ksh${
      item.item_price * item.quantity
    }\n`;
  });
  summary += `Total: Ksh${cart.product_items.reduce(
    (a, b) => a + b.item_price * b.quantity,
    0
  )}`;
  return summary;
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
