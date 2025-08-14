// api/shopify-webhook.js
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const serverless = require("serverless-http");

const app = express();
app.use(bodyParser.json());

// ✅ Use environment variables (configured in Vercel dashboard)
const KOGAN_SELLER_ID = process.env.KOGAN_SELLER_ID;
const KOGAN_SELLER_TOKEN = process.env.KOGAN_SELLER_TOKEN;

// Shopify webhook listener
app.post("/api/server", async (req, res) => {
  console.log("📥 Incoming Shopify webhook");

  const product = req.body;
  console.log("📦 Shopify product data:", JSON.stringify(product, null, 2));

  // Convert to Kogan format
  const koganProduct = {
    sku: product.variants?.[0]?.sku || `SKU-${product.id}`,
    name: product.title || "Untitled Product",
    description: product.body_html || "",
    price: parseFloat(product.variants?.[0]?.price) || 0,
    quantity: product.variants?.[0]?.inventory_quantity || 0,
    brand: product.vendor || "Generic",
    categories: ["Other"],
    images: product.images?.map((img) => img.src) || [],
  };

  try {
    const response = await axios.post(
      "https://nimda-marketplace.aws.kgn.io/api/marketplace/v2/products/import",
      { products: [koganProduct] },
      {
        headers: {
          "Content-Type": "application/json",
          SellerId: KOGAN_SELLER_ID,
          SellerToken: KOGAN_SELLER_TOKEN,
        },
      }
    );

    console.log("✅ Product sent to Kogan:", response.data);
    return res.status(200).send("OK");
  } catch (err) {
    console.error(
      "❌ Error sending to Kogan:",
      err.response?.data || err.message
    );
    return res.status(500).send("Error");
  }
});

// ✅ Export for Vercel Serverless
module.exports = app;
module.exports.handler = serverless(app);
