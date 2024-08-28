import puppeteer from "puppeteer";
import { Product } from "../models";
import generateJobId from "../utils";

export default async function scrapWithNoon(url: string) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      userDataDir: "./tmp",
      //   browserContext: "default",
    });

    const page = await browser.newPage();

    await page.setCacheEnabled(false);

    // Set the location to the United Arab Emirates (UAE)
    await page.setGeolocation({ latitude: 24.4539, longitude: 54.3773 });

    const client = await page.target().createCDPSession();

    await client.send("Emulation.setGeolocationOverride", {
      accuracy: 100,
      latitude: 24.42312,
      longitude: 105.75868,
    });

    // Increase navigation timeout to 60 seconds
    await page.setDefaultNavigationTimeout(60000);

    await page.goto(url);

    let product: Product = {
      jobId: generateJobId(),
      url: url,
      title: null,
      brand: null,
      image: null,
      price: null,
      currency: null,
      specifications: null,
      highlights: null,
      estimator: null,
      shipping_price: null,
      model: [],
      description: null,
      description_images: [],
      measurements: null,
    };

    try {
      product.title = await page.evaluate(() => {
        const titleElement = document.querySelector(".sc-320c5568-18");
        return titleElement ? titleElement.textContent?.trim() : "Not found";
      });
    } catch (error) {
      console.error("Error occurred while extracting title:", error);
    }

    try {
      product.brand = await page.evaluate(() => {
        const brandElement = document.querySelector(
          "div.sc-320c5568-17.jvojBZ"
        );
        return brandElement ? brandElement.textContent?.trim() : "Not found";
      });
    } catch (error) {
      console.error("Error occurred while extracting brand:", error);
    }

    try {
      product.image = await page.evaluate(() => {
        const imageElement = document.querySelector(
          "div.sc-d8caf424-2.fJBKzl img"
        );
        return imageElement ? imageElement.getAttribute("src") : "Not found";
      });
    } catch (error) {
      console.error("Error occurred while extracting image:", error);
    }

    try {
      let priceResult = await page.evaluate(() => {
        const priceElement = document.querySelector(
          'div.priceNow[data-qa="div-price-now"]'
        );
        return priceElement ? priceElement.textContent?.trim() : "Not found";
      });

      if (/^\d*\.?\d+$/.test(priceResult!)) {
        product.price = parseFloat(priceResult!.replace(/[^\d.]/g, ""));
      } else {
        product.price = null;
      }
    } catch (error) {
      console.error("Error occurred while extracting price:", error);
    }

    try {
      product.currency = await page.evaluate(() => {
        const currencyElement = document.querySelector(
          'div.priceNow[data-qa="div-price-now"]'
        );
        if (currencyElement) {
          const currencyText = currencyElement.textContent?.trim();
          // Extract the currency symbol, considering typical currency symbols including those not in the A-Z range
          const currencySymbolMatch = currencyText?.match(/[\$\£\€\¥\₹\₩]+/); // Adjust regex as needed to cover expected currency symbols
          return currencySymbolMatch ? currencySymbolMatch[0] : "Not found";
        } else {
          return "Not found";
        }
      });
    } catch (error) {
      console.error("Error occurred while extracting currency symbol:", error);
    }

    try {
      product.specifications = await page.evaluate(() => {
        const specificationsElements = document.querySelectorAll(
          "div.sc-966c8510-0.jLcJyt"
        );
        return Array.from(specificationsElements, (element) =>
          element.textContent?.trim()
        ).join("\n");
      });
    } catch (error) {
      console.error("Error occurred while extracting specifications:", error);
    }

    try {
      product.highlights = await page.evaluate(() => {
        const highlightsElements = document.querySelectorAll(
          "div.sc-97eb4126-1.iMnGaT"
        );
        return Array.from(highlightsElements, (element) =>
          element.textContent?.trim()
        ).join("\n");
      });
    } catch (error) {
      console.error("Error occurred while extracting highlights:", error);
    }

    try {
      product.estimator = await page.evaluate(() => {
        const estimatorElement = document.querySelector("div.estimator_first");
        return estimatorElement
          ? estimatorElement.textContent?.trim()
          : "Not found";
      });
    } catch (error) {
      console.error("Error occurred while extracting Shipping Price:", error);
    }

    try {
      product.model = await page.evaluate(() => {
        const modelElement = document.querySelector("div.modelNumber");
        return modelElement ? modelElement.textContent?.trim() : "Not found";
      });
    } catch (error) {
      console.error("Error occurred while extracting model number:", error);
    }

    try {
      // Extract the shipping price as text from the page
      const shippingPriceText = await page.evaluate(() => {
        const shippingPriceElement = document.querySelector(
          'div[data-pl="product-shipping"] div.dynamic-shipping div.dynamic-shipping-line.dynamic-shipping-titleLayout span strong'
        );
        return shippingPriceElement
          ? shippingPriceElement.textContent?.trim()
          : "Not found";
      });

      // Check if the shipping price was found before attempting to parse it
      if (shippingPriceText !== "Not found") {
        // Parse the shipping price text to a float after removing all non-numeric characters except the decimal point
        const parsedShippingPrice = parseFloat(
          shippingPriceText!.replace(/[^\d.]/g, "")
        );
        // Assign the parsed shipping price to the product object if it's a valid number; otherwise, set it to a default or error value
        product.shipping_price = !isNaN(parsedShippingPrice)
          ? parsedShippingPrice
          : null;
      } else {
        // Handle the case where the shipping price was not found
        product.shipping_price = null;
      }
    } catch (error) {
      console.error("Error occurred while extracting Shipping Price:", error);
    }

    return product;
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
