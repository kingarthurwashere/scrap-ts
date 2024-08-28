import puppeteer from "puppeteer";
import { Product } from "../models";
import generateJobId from "../utils";

export default async function scrapWithAliexpress(url: string) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      userDataDir: "./tmp",
      
    });

    const page = await browser.newPage();

    await page.setCacheEnabled(false);

    // Set the location to the United Arab Emirates (UAE)
    await page.setGeolocation({ latitude: 24.4539, longitude: 54.3773 });

    // Set English language
   
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
      description_images: [],
      description: null,
      measurements: null,
    };

    try {
      product.title = await page.evaluate(() => {
        const titleElement = document.querySelector(
          'h1[data-pl="product-title"]'
        );
        return titleElement ? titleElement.textContent?.trim() : "Not found";
      });
    } catch (error) {
      console.error("Error occurred while extracting title:", error);
    }

    try {
      product.image = await page.evaluate(() => {
        const imageElement = document.querySelector(
          "div.image-view--previewBox--FyWaIlU img.magnifier--image--L4hZ4dC"
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
          "div.price--current--H7sGzqb.product-price-current"
        );
        return priceElement ? priceElement.textContent?.trim() : "Not found";
      });

      // Check if the price was successfully extracted before attempting to parse
      if (priceText !== "Not found") {
        // Attempt to parse the extracted price text to a float, removing all non-numeric characters except the decimal point
        const parsedPrice = parseFloat(priceText!.replace(/[^\d.]/g, ""));
        // Assign the parsed price to the product object if it's a valid number; otherwise, set it to a default or error value
        product.price = !isNaN(parsedPrice) ? parsedPrice : null;
      } else {
        // Handle the case where the price was not found
        product.price = null;
      }
    } catch (error) {
      console.error("Error occurred while extracting price:", error);
    }

    try {
      product.currency = await page.evaluate(() => {
        const currencyElement = document.evaluate(
          '//span[@class="es--char--Vcv75ku"]',
          document,
          null,
          XPathResult.ANY_TYPE,
          null
        );
        const currencyNode = currencyElement.iterateNext();
        return currencyNode ? currencyNode.textContent : "Not found";
      });
    } catch (error) {
      console.error("Error occurred while extracting currency symbol:", error);
    }

    try {
      product.description = await page.evaluate(() => {
        const descriptionElements = document.querySelectorAll(
          "div#product-description div.description--origin-part--SsZJoGC div.detailmodule_html div.detail-desc-decorate-richtext div"
        );
        return Array.from(descriptionElements, (element) =>
          element.textContent?.trim()
        ).join("\n");
      });
    } catch (error) {
      console.error("Error occurred while extracting description:", error);
    }

    try {
      product.shipping_price = await page.evaluate(() => {
        const shippingPriceElement = document.querySelector(
          'div[data-pl="product-shipping"] div.dynamic-shipping div.dynamic-shipping-line.dynamic-shipping-titleLayout span strong'
        );
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

    try {
      product.description_images = await page.evaluate(() => {
        const imageElements = document.evaluate(
          '//div[@id="product-description"]//img/@src',
          document,
          null,
          XPathResult.ANY_TYPE,
          null
        );
        const result = [];
        let node = imageElements.iterateNext();
        while (node) {
          result.push(node.nodeValue);
          node = imageElements.iterateNext();
        }
        return result;
      });
    } catch (error) {
      console.error(
        "Error occurred while extracting description images:",
        error
      );
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
