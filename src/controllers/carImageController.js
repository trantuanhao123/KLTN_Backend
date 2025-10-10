const carImageService = require("../services/carImageService");

const handleGetImagesByCarId = async (req, res) => {
  try {
    const carId = parseInt(req.params.carId);
    if (isNaN(carId)) return res.status(400).json({ error: "Invalid car ID" });

    const images = await carImageService.getCarImages(carId);
    return res.status(200).json(images);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const handleAddCarImages = async (req, res) => {
  try {
    const carId = parseInt(req.params.carId);
    if (isNaN(carId)) return res.status(400).json({ error: "Invalid car ID" });

    const files = req.files || [];
    const added = await carImageService.addCarImage(carId, files);
    return res.status(201).json({
      message: "Images uploaded successfully",
      added,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const handleDeleteCarImage = async (req, res) => {
  try {
    const imageId = parseInt(req.params.imageId);
    if (isNaN(imageId))
      return res.status(400).json({ error: "Invalid image ID" });

    const result = await carImageService.deleteCarImage(imageId);
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    const status = error.message.includes("not found") ? 404 : 500;
    return res.status(status).json({ error: error.message });
  }
};

module.exports = {
  handleGetImagesByCarId,
  handleAddCarImages,
  handleDeleteCarImage,
};
