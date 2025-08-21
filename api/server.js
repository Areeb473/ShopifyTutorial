// --- START OF FILE server.js ---

const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const serverless = require("serverless-http");

const app = express();
// It's important to use bodyParser.json() for webhook data
app.use(bodyParser.json());

// Use environment variables (configured in Vercel dashboard or .env)
const KOGAN_SELLER_ID = process.env.KOGAN_SELLER_ID;
const KOGAN_SELLER_TOKEN = process.env.KOGAN_SELLER_TOKEN;

// This should match the path in your vercel.json `routes`
app.post("/api/server", async (req, res) => {
  console.log("📥 Incoming Shopify webhook");

  const product = req.body;
  console.log("📦 Shopify product data:", JSON.stringify(product, null, 2));

  // A basic check to ensure you have a product to process
  if (!product || !product.id) {
    console.warn("⚠️ Webhook received but no product data found.");
    return res.status(400).send("Bad Request: No product data.");
  }

  // Convert to Kogan format
  const koganProduct = {
    sku: product.variants?.[0]?.sku || `SKU-${product.id}`,
    name: product.title || "Untitled Product",
    description: product.body_html || "",
    price: parseFloat(product.variants?.[0]?.price) || 0,
    quantity: product.variants?.[0]?.inventory_quantity || 0,
    brand: product.vendor || "Generic",
    categories: ["Other"], // Make sure this is a valid Kogan category
    images: product.images?.map((img) => img.src) || [],
  };

  try {
    // Note: The Kogan API docs often use an "import" endpoint for bulk operations.
    // Check if a single product creation endpoint exists or if this is correct.
    const response = await axios.post(
      "https://nimda-marketplace.aws.kgn.io/api/marketplace/v2/products/import",
      { products: [koganProduct] }, // The import endpoint expects a `products` array
      {
        headers: {
          "Content-Type": "application/json",
          "SellerId": KOGAN_SELLER_ID,
          "SellerToken": KOGAN_SELLER_TOKEN,
        },
      }
    );

    console.log("✅ Product sent to Kogan via webhook:", response.data);
    return res.status(200).send("OK");
  } catch (err) {
    console.error(
      "❌ Error sending to Kogan from webhook:",
      err.response?.data || err.message
    );
    // Send a 502 Bad Gateway if the upstream API fails, which is more accurate
    return res.status(502).send("Error forwarding webhook to Kogan.");
  }
});

// Export for Vercel Serverless
module.exports.handler = serverless(app);

// You can also export the app for local testing if needed
module.exports = app;