require("dotenv").config();
const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const mongoUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(mongoUrl);
}

const initDB = async () => {
  try {
    // Clear existing listings
    await Listing.deleteMany({});

    // Add initial data without geocoding
    const updatedData = initData.data.map((obj) => ({
      ...obj,
      owner: "66567b03fda820235197b582",
      geometry: null, // no map coordinates
    }));

    await Listing.insertMany(updatedData);
    console.log("DB is initialized");
  } catch (error) {
    console.error("Error initializing DB:", error);
  }
};

initDB();
