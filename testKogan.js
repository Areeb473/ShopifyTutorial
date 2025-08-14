const axios = require("axios");
require("dotenv").config();
// ------------------- CONFIG -------------------
const KOGAN_SELLER_ID = process.env.KOGAN_SELLER_ID;
const KOGAN_SELLER_TOKEN = process.env.KOGAN_SELLER_TOKEN;
// Kogan API endpoint to get products
const KOGAN_API_URL = "https://nimda-marketplace.aws.kgn.io/api/marketplace/v2/products";

async function testKoganAPI() {
  try {
    const response = await axios.get(KOGAN_API_URL, {
      headers: {
        "Content-Type": "application/json",
        "SellerId": KOGAN_SELLER_ID,
        "SellerToken": KOGAN_SELLER_TOKEN
      }
    });

    console.log("✅ Kogan API connected successfully!");
    console.log("Response:", response.data);
  } catch (error) {
    console.error(
      "❌ Error connecting to Kogan API:",
      error.response ? error.response.data : error.message
    );
  }
}

testKoganAPI();
