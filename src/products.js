'use strict';

class ProductLoadError extends Error {
  constructor(message, { status, cause } = {}) {
    super(message, { cause });
    this.name = 'ProductLoadError';
    this.status = status;
  }
}

function normalizeProduct(raw) {
  return {
    sku: String(raw.sku).toUpperCase(),
    name: String(raw.name).trim(),
    price: Math.round(Number(raw.price) * 100),
    inStock: raw.stock > 0,
  };
}

/**
 * Fetch the product list. Network failures are retried up to `retries`
 * times; HTTP error responses are not retried.
 */
async function loadProducts({ fetch = globalThis.fetch, url = '/api/products', retries = 2 } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    let response;
    try {
      response = await fetch(url, { headers: { Accept: 'application/json' } });
    } catch (err) {
      lastError = err;
      continue;
    }

    if (!response.ok) {
      lastError = new ProductLoadError(`Product API responded with ${response.status}`, {
        status: response.status,
      });
      continue;
    }

    const body = await response.json();
    return body.products.map(normalizeProduct);
  }

  if (lastError instanceof ProductLoadError) {
    throw lastError;
  }
  throw new ProductLoadError(`Could not load products after ${retries + 1} attempts`, {
    cause: lastError,
  });
}

module.exports = { loadProducts, normalizeProduct, ProductLoadError };
