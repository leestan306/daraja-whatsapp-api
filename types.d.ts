type WhatsAppWebhookPayload = {
  object: string; // "whatsapp_business_account"
  entry: Entry[];
};

type Entry = {
  id: string; // e.g., "1149145943105140"
  changes: Change[];
};

type Change = {
  value: Value;
  field: string; // e.g., "messages"
};

type Value = {
  messaging_product: string; // "whatsapp"
  metadata: Metadata;
  contacts?: Contact[]; // Optional, depending on the payload
  messages?: Message[]; // Optional, depending on the payload
};

type Metadata = {
  display_phone_number: string; // e.g., "254785017308"
  phone_number_id: string; // e.g., "608850068971462"
};

type Contact = {
  profile: Profile;
  wa_id: string; // e.g., "254707067474"
};

type Profile = {
  name: string; // e.g., "Leestan.dev"
};

type Message = {
  from: string; // Sender's phone number, e.g., "254707067474"
  id: string; // Unique message ID, e.g., "wamid.HBgMMjU0NzA3MDY3NDc0FQIAEhgUM0EwOTkxMTlDODhENzczQkU5RDkA"
  timestamp: string; // Unix timestamp as a string, e.g., "1741030393"
  type: MessageType; // Message type, e.g., "order" or "text"
  order: OrderMessage;
  text: TextMessage;
};

// Union type for different message types
type MessageType = "text" | "order"; // Extend this if more types are added

type TextMessage = {
  text: {
    body: string; // The actual text content of the message
  };
};

type OrderMessage = {
  order: {
    catalog_id: string; // Catalog ID, e.g., "3871082173201882"
    text: string; // Optional text, e.g., ""
    product_items: ProductItem[];
  };
};

type ProductItem = {
  product_retailer_id: string; // Unique product ID, e.g., "493yuczk8r"
  quantity: number; // Quantity of the product, e.g., 2
  item_price: number; // Price per item, e.g., 200
  currency: string; // Currency code, e.g., "KES"
};
