// build express app

import express from "express";
import scrapWithNoon from "./platforms/noon";
import scrapWithAliexpress from "./platforms/aliexpress";
import scrapWithShein from "./platforms/shein";

const app = express();
app.use(express.json());

const allowedPlatforms = ["noon", "aliexpress", "shein"];

app.post("/", async (req, res) => {
  // get platform from body
  const { url, platform } = req.body;

  // check if platform is allowed
  if (!allowedPlatforms.includes(platform)) {
    res.status(400).json({
      message: "Platform not allowed",
    });
    return;
  }

  if (!url) {
    res.status(400).json({
      message: "URL is required",
    });
    return;
  }

  // call the platform function
  if (platform == "noon") {
    let data = await scrapWithNoon(url);
    return res.json(data);
  } else if (platform == "aliexpress") {
    let data = await scrapWithAliexpress(url);
    return res.json(data);
  } else if (platform == "shein") {
    let data = await scrapWithShein(url);
    return res.json(data);
  } else {
    res.status(400).json({
      message: "Platform not found",
    });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
