const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
require("dotenv").config();
const app = express();
app.use(bodyParser.json());

// Kogan credentials
const KOGAN_SELLER_ID = process.env.KOGAN_SELLER_ID;
const KOGAN_SELLER_TOKEN = process.env.KOGAN_SELLER_TOKEN;

// Shopify webhook listener
app.post("/shopify-webhook", async (req, res) => {
  const product = req.body;
  console.log("📦 Shopify sent product data:", product);

  const koganProduct = {
    sku: product.variants[0].sku || `SKU-${product.id}`,
    name: product.title,
    description: product.body_html || '',
    price: parseFloat(product.variants[0].price),
    quantity: product.variants[0].inventory_quantity,
    brand: product.vendor || 'Generic',
    categories: ['Other'],
    images: product.images.map(img => img.src)
  };

  try {
    const response = await axios.post(
      "https://nimda-marketplace.aws.kgn.io/api/marketplace/v2/products/import",
      { products: [koganProduct] },
      {
        headers: {
          "Content-Type": "application/json",
          "SellerId": KOGAN_SELLER_ID,
          "SellerToken": KOGAN_SELLER_TOKEN
        }
      }
    );

    console.log("✅ Product sent to Kogan:", response.data);
    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Error sending to Kogan:", err.response?.data || err.message);
    res.status(500).send("Error");
  }
});

// For Vercel deployment
module.exports = app;
