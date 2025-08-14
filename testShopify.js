const axios = require("axios");
require("dotenv").config();
const SHOPIFY_STORE = process.env.SHOPIFY_STORE; // Example: mystore
const SHOPIFY_TOKEN = process.env.SHOPIFY_TOKEN;

async function testShopifyAPI() {
  try {
    const response = await axios.get(
      `https://${SHOPIFY_STORE}/admin/api/2025-01/products.json`,
      {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_TOKEN,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Shopify API connected successfully!");
    console.log("Products:", response.data.products);
  } catch (error) {
    console.error("❌ Shopify API error:", error.response ? error.response.data : error.message);
  }
}

testShopifyAPI();
