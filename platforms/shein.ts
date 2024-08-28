import puppeteer from "puppeteer";
import { Product } from "../models";
import generateJobId from "../utils";

export default async function scrapeWithShein(url: string) {
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

    // Set English language
    await page.setExtraHTTPHeaders({
      "Accept-Currency": "AED",
    });

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
      measurements: null,
      estimator: null,
      shipping_price: null,
      model: [],
      highlights: null,
      description_images: [],
      description: null,
    };

    try {
      product.title = await page.evaluate(() => {
        const titleElement = document.querySelector(
          "h1.product-intro__head-name"
        );
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
          "div.product-intro__thumbs-inner div.product-intro__thumbs-item img"
        );
        return imageElement ? imageElement.getAttribute("src") : "Not found";
      });
    } catch (error) {
      console.error("Error occurred while extracting image:", error);
    }

    try {
      // Extract the price as text from the page
      const priceText = await page.evaluate(() => {
        const priceElement = document.querySelector(
          "div.product-intro__head-mainprice div.original span"
        );
        return priceElement ? priceElement.textContent?.trim() : "Not found";
      });

      // Validate extracted price text before attempting to parse
      if (priceText !== "Not found") {
        // Convert the price text into a floating-point number, removing any characters that are not digits or a period
        const parsedPrice = parseFloat(priceText!.replace(/[^\d.]/g, ""));
        // Ensure the parsed price is a number. If not, set a default value or handle as needed
        product.price = isNaN(parsedPrice) ? null : parsedPrice;
      } else {
        // Handle the case where the price element was not found
        product.price = null;
      }
    } catch (error) {
      console.error("Error occurred while extracting price:", error);
    }

    try {
      product.currency = await page.evaluate(() => {
        const currencyElement = document.querySelector(
          "div.product-intro__head-mainprice div.original span"
        );
        if (currencyElement) {
          const currencyText = currencyElement.textContent?.trim();
          // Attempt to extract a currency symbol from the text
          // This regex looks for common currency symbols including $, €, £, and ¥.
          // Add more symbols as needed to cover other currencies you expect to encounter
          const currencySymbolMatch = currencyText?.match(/[\$\€\£\¥]/);
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
          "div.product-intro__attr-wrap div.product-intro__description-table-item"
        );
        return Array.from(specificationsElements, (element) =>
          element.textContent?.trim()
        ).join("\n");
      });
    } catch (error) {
      console.error("Error occurred while extracting specifications:", error);
    }

    try {
      product.measurements = await page.evaluate(() => {
        const measurementsElements = document.querySelectorAll(
          "div.product-intro__size-choose.fsp-element div.product-intro__size-radio"
        );
        return Array.from(measurementsElements, (element) =>
          element.textContent?.trim()
        ).join("\n");
      });
    } catch (error) {
      console.error("Error occurred while extracting measurements:", error);
    }

    try {
      product.estimator = await page.evaluate(() => {
        const estimatorElement = document.evaluate(
          '//p[contains(@class, "product-intro__freeshipping-time")]',
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        return estimatorElement
          ? estimatorElement.textContent?.trim()
          : "Not found";
      });
    } catch (error) {
      console.error("Error occurred while extracting estimator:", error);
    }

    try {
      product.model = await page.evaluate(() => {
        const modelElement = document.evaluate(
          '//div[@class="product-intro__head-sku"]//font[contains(text(), "SKU:")]',
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        return modelElement
          ? modelElement.textContent?.trim().replace("SKU: ", "")
          : "Not found";
      });
    } catch (error) {
      console.error("Error occurred while extracting model number:", error);
    }

    try {
      product.shipping_price = await page.evaluate(() => {
        const shippingPriceElement = document.evaluate(
          '//div[@class="shipping-price"]',
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        return shippingPriceElement
          ? shippingPriceElement.textContent?.trim()
          : "Not found";
      });
      product.shipping_price = parseFloat(
        product.shipping_price!.replace(/[^\d.]/g, "")
      );
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
