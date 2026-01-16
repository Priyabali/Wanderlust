const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
  const allListings = await Listing.find();
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested does not exist!");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;

  if (req.file) {
    newListing.image = {
      filename: req.file.filename,
      url: req.file.path,
    };
  }

  await newListing.save();
  req.flash("success", "New listing created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you are trying to edit does not exist!");
    return res.redirect("/listings");
  }

  let imageUrl = listing.image?.url;
  if (imageUrl) {
    imageUrl = imageUrl.replace("/upload", "/upload/w_250,h_160");
  }

  res.render("listings/edit.ejs", { listing, imageUrl });
};

module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const updatedListing = await Listing.findByIdAndUpdate(id, {
    ...req.body.listing,
  });

  if (req.file) {
    updatedListing.image = {
      filename: req.file.filename,
      url: req.file.path,
    };
    await updatedListing.save();
  }

  req.flash("success", "Listing updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.filter = async (req, res) => {
  const { id } = req.params;
  const allListings = await Listing.find({ category: { $all: [id] } });

  if (allListings.length > 0) {
    res.locals.success = `Listings filtered by ${id}!`;
    res.render("listings/index.ejs", { allListings });
  } else {
    req.flash("error", `No listings found for category: ${id}`);
    res.redirect("/listings");
  }
};

module.exports.search = async (req, res) => {
  let input = req.query.q?.trim().replace(/\s+/g, " ") || "";
  if (!input) {
    req.flash("error", "Please enter a search query!");
    return res.redirect("/listings");
  }

  const searchTerm = input
    .split("")
    .map((char, i) => (i === 0 || input[i - 1] === " " ? char.toUpperCase() : char.toLowerCase()))
    .join("");

  let allListings = await Listing.find({ title: { $regex: searchTerm, $options: "i" } });

  if (allListings.length > 0) {
    res.locals.success = "Listings searched by Title!";
    return res.render("listings/index.ejs", { allListings });
  }

  allListings = await Listing.find({ category: { $regex: searchTerm, $options: "i" } }).sort({ _id: -1 });
  if (allListings.length > 0) {
    res.locals.success = "Listings searched by Category!";
    return res.render("listings/index.ejs", { allListings });
  }

  allListings = await Listing.find({ country: { $regex: searchTerm, $options: "i" } }).sort({ _id: -1 });
  if (allListings.length > 0) {
    res.locals.success = "Listings searched by Country!";
    return res.render("listings/index.ejs", { allListings });
  }

  allListings = await Listing.find({ location: { $regex: searchTerm, $options: "i" } }).sort({ _id: -1 });
  if (allListings.length > 0) {
    res.locals.success = "Listings searched by Location!";
    return res.render("listings/index.ejs", { allListings });
  }

  const intValue = parseInt(searchTerm, 10);
  if (!isNaN(intValue)) {
    allListings = await Listing.find({ price: { $lte: intValue } }).sort({ price: 1 });
    if (allListings.length > 0) {
      res.locals.success = `Listings searched by price less than Rs ${intValue}!`;
      return res.render("listings/index.ejs", { allListings });
    }
  }

  req.flash("error", "No listings found based on your search!");
  res.redirect("/listings");
};

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing deleted!");
  res.redirect("/listings");
};

module.exports.reserveListing = async (req, res) => {
  const { id } = req.params;
  req.flash("success", "Reservation details sent to your email!");
  res.redirect(`/listings/${id}`);
};
