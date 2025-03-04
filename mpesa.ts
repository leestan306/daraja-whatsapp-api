import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();
// mpesa
const MPESA_CONSUMER_KEY =
  process.env.MPESA_CONSUMER_KEY || "your_consumer_key";
const MPESA_CONSUMER_SECRET =
  process.env.MPESA_CONSUMER_SECRET || "your_consumer_secret";
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || "your_shortcode";
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || "your_passkey";
const MPESA_CALLBACK_URL =
  process.env.MPESA_CALLBACK_URL || "http://yourdomain.com/stk-callback";

/**
 * Get Access Token from Safaricom
 */
export async function getAccessToken(): Promise<string> {
  console.log({
    MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET,
    MPESA_SHORTCODE,
    MPESA_PASSKEY,
    MPESA_CALLBACK_URL,
  });
  const auth = Buffer.from(
    `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`
  ).toString("base64");
  const response = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );
  return response.data.access_token;
}

/**
 * Initiate STK Push
 */
export async function stkPushPrompt(
  accessToken: string,
  phoneNumber: string,
  amount: number
): Promise<any> {
  const timestamp = getTimestamp();
  const password = Buffer.from(
    `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`
  ).toString("base64");

  const payload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: phoneNumber,
    CallBackURL: MPESA_CALLBACK_URL,
    AccountReference: "Order Payment",
    TransactionDesc: "Order Payment",
  };

  const response = await axios.post(
    "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.data;
}
const getTimestamp = () => {
  const dateString = new Date().toLocaleString("en-us", {
    timeZone: "Africa/Nairobi",
  });
  const dateObject = new Date(dateString);
  function parseDate(val: number) {
    return val < 10 ? "0" + val : val;
  }
  const month = parseDate(dateObject.getMonth() + 1);
  const day = parseDate(dateObject.getDate());
  const hour = parseDate(dateObject.getHours());
  const minute = parseDate(dateObject.getMinutes());
  const second = parseDate(dateObject.getSeconds());
  return (
    dateObject.getFullYear() +
    "" +
    month +
    "" +
    day +
    "" +
    hour +
    "" +
    minute +
    "" +
    second
  );
};
