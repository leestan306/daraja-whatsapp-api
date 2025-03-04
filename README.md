# WhatsApp M-Pesa Integration

This project integrates WhatsApp Business API with M-Pesa Daraja API to process payments and notify users via WhatsApp upon successful payment.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Running the Application](#running-the-application)
- [Environment Variables](#environment-variables)
- [Endpoints](#endpoints)
- [Dockerization](#dockerization)

---

## Prerequisites

Before running this project, ensure you have the following installed:

- Node.js (v16 or higher)
- npm or yarn
- Docker (for optional Docker setup)
- PostgreSQL (if not using Docker)

---

## Setup Instructions

1. **Clone the Repository**

   ```bash
   git clone https://github.com/leestan306/daraja-whatsapp-api.git
   cd your-repo-name
   ```

2. **Install Dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set Environment Variables**
   Copy the `.env.example` file to `.env`:

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your credentials:

   - `WHATSAPP_VERIFY_TOKEN`: Your WhatsApp webhook verification token.
   - `WHATSAPP_ACCESS_TOKEN`: Your WhatsApp access token.
   - `WHATSAPP_PHONE_NUMBER_ID`: Your WhatsApp phone number ID.
   - `DATABASE_URL`: Your PostgreSQL database connection string.
   - `MPESA_CONSUMER_KEY`: Your M-Pesa Consumer Key.
   - `MPESA_CONSUMER_SECRET`: Your M-Pesa Consumer Secret.
   - `MPESA_SHORTCODE`: Your M-Pesa shortcode.
   - `MPESA_PASSKEY`: Your M-Pesa passkey.
   - `MPESA_CALLBACK_URL`: The URL where M-Pesa will send the callback (e.g., `https://your-domain.com/stk-callback`).

4. **Database Setup**

   - If using Docker, skip to the "Dockerization" section.
   - Otherwise, create a PostgreSQL database and update the `DATABASE_URL` in the `.env` file.

5. **Prisma Migration**
   Run the following commands to generate Prisma client and apply migrations:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

---

## Running the Application

1. **Start the Server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Verify the Webhook**

   - Access `http://localhost:5000/webhook?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=CHALLENGE_ACCEPTED`.
   - Ensure the response is `CHALLENGE_ACCEPTED`.

3. **Test the STK Push**

   - Place an order via WhatsApp.
   - Verify that the STK push is initiated and the user receives a payment prompt.

4. **Test the Callback**
   - Simulate an M-Pesa callback by sending a POST request to `/stk-callback` with the appropriate payload.

---

## Environment Variables

Create a `.env` file based on `.env.example` and fill in the required values:

```
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

DATABASE_URL="postgresql://postgress:password@localhost:5432/daraja_whatsapp?schema=public"

# mpesa
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-domain.com/stk-callback
```

---

## Endpoints

- **Webhook Verification**

  - `GET /webhook`: Verifies the webhook URL.
    - Query Parameters:
      - `hub.mode`: Set to `subscribe`.
      - `hub.verify_token`: Your verification token.
      - `hub.challenge`: A challenge string provided by WhatsApp.

- **Handle Incoming Messages**

  - `POST /webhook`: Handles incoming messages and orders from WhatsApp.

- **STK Push Callback**
  - `POST /stk-callback`: Handles the M-Pesa STK push callback.

---

## Contact

For any questions or support, contact [your-email@example.com](mailto:your-email@example.com).

### **Final Notes**

- Replace placeholders like `your_verify_token`, `your_access_token`, etc., with actual values.
- Ensure the `MPESA_CALLBACK_URL` points to your live server if deploying to production.
- Use tools like Ngrok (`https://ngrok.com`) to expose your local server for testing callbacks.

This setup provides a robust and scalable foundation for integrating WhatsApp and M-Pesa in your application.
