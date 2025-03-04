import express, { Request, Response } from "express";
import axios from "axios";
import * as dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { getAccessToken, stkPushPrompt } from "./mpesa";
dotenv.config();
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "your_verify_token";
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "your_access_token";
const PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID || "your_phone_number_id";

/**
 * Webhook verification endpoint
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
  const entry = body.entry?.[0];
  if (!entry) return res.status(200).end();
  const changes = entry.changes?.[0];
  if (!changes) return res.status(200).end();
  const value = changes.value;
  const messaging = value.messages?.[0];
  if (messaging) {
    const senderPhoneNumber = messaging.from;
    const messageText = messaging.text?.body;
    const order = changes.value?.messages?.[0]?.order;

    if (messageText) {
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
  } catch (error) {
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
 */
async function handleOrderEvent(value: OrderMessageType) {
  const customerPhoneNumber = value.from;
  const cartDetails = value.order;

  // Calculate total amount
  const totalAmount = cartDetails.product_items.reduce(
    (a, b) => a + b.item_price * b.quantity,
    0
  );

  // Create the main order record
  const order = await prisma.order.create({
    data: {
      phoneNumber: customerPhoneNumber,
      catalogId: cartDetails.catalog_id,
      text: cartDetails.text,
      currency: cartDetails.product_items[0].currency, // Assuming all items have the same currency
      totalAmount,
    },
  });
  // Create individual item records for the order
  await prisma.item.createMany({
    data: cartDetails.product_items.map((item) => ({
      orderId: order.id,
      productRetailerId: item.product_retailer_id,
      quantity: item.quantity,
      itemPrice: item.item_price,
    })),
  });

  // Initiate STK Push
  const accessToken = await getAccessToken();
  console.log("Access Token:", accessToken);
  const result = await stkPushPrompt(
    accessToken,
    customerPhoneNumber,
    Math.ceil(totalAmount / 100)
  );

  let merchantRequestId = result.MerchantRequestID;
  let checkoutRequestId = result.CheckoutRequestID;
  await prisma.order.update({
    where: { id: order.id },
    data: { merchantRequestId, checkoutRequestId },
  });

  console.log("STK Push Result:", result);
  await sendMessage(
    customerPhoneNumber,
    `Please complete the payment of Ksh${totalAmount} using the M-Pesa prompt.`
  );
}

/**
 * Handle STK Push Callback
 */
app.post("/stk-callback", async (req: Request, res: Response) => {
  const body = req.body;
  console.log("STK Push Callback:", JSON.stringify(body, null, 2));
  if (body.Body?.stkCallback?.ResultCode === 0) {
    const merchantRequestId = body.Body.stkCallback.MerchantRequestID;
    const checkoutRequestId = body.Body.stkCallback.CheckoutRequestID;
    const resultDesc = body.Body.stkCallback.ResultDesc;
    let amount = body.Body.stkCallback.CallbackMetadata.Item.find(
      (item: any) => item.Name === "Amount"
    )?.Value;
    let referenceNumber = body.Body.stkCallback.CallbackMetadata.Item.find(
      (item: any) => item.Name === "MpesaReceiptNumber"
    )?.Value;
    amount = Math.ceil(Number(amount) * 100);
    try {
      // Update order status in Prisma
      const updatedOrder = await prisma.order.update({
        where: { merchantRequestId },
        data: {
          status: "PAID",
          checkoutRequestId,
          resultDesc,
          amount,
        },
      });
      console.log("Order updated:", updatedOrder);
      // Send confirmation message to user via WhatsApp
      const phoneNumber = updatedOrder.phoneNumber;
      const message = `Your payment of Ksh${amount} has been successfully received. Thank you for your purchase! \n Transaction ID: ${referenceNumber} .Your order is been processed!`;
      await sendMessage(phoneNumber, message);
      console.log(`WhatsApp message sent to ${phoneNumber}: ${message}`);
    } catch (error) {
      console.error("Error updating order or sending WhatsApp message:", error);
    }
  } else {
    console.error("Payment failed:", body.Body.stkCallback.ResultDesc);
  }

  res.status(200).end();
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
