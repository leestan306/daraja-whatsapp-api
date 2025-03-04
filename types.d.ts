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
