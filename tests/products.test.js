const { loadProducts, ProductLoadError } = require('../src/products');

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

const PAYLOAD = {
  products: [
    { sku: 'tee-blk-m', name: ' Logo Tee (Black, M) ', price: '24.00', stock: 12 },
    { sku: 'MUG-01', name: 'Enamel Mug', price: 14.5, stock: 0 },
  ],
};

describe('loadProducts', () => {
  test('normalizes SKUs, names, prices and stock', async () => {
    const fetch = jest.fn().mockResolvedValue(jsonResponse(200, PAYLOAD));

    await expect(loadProducts({ fetch })).resolves.toEqual([
      { sku: 'TEE-BLK-M', name: 'Logo Tee (Black, M)', price: 2400, inStock: true },
      { sku: 'MUG-01', name: 'Enamel Mug', price: 1450, inStock: false },
    ]);
  });

  test('requests JSON from the configured URL', async () => {
    const fetch = jest.fn().mockResolvedValue(jsonResponse(200, { products: [] }));
    await loadProducts({ fetch, url: '/api/v2/products?collection=fall' });

    expect(fetch).toHaveBeenCalledWith('/api/v2/products?collection=fall', {
      headers: { Accept: 'application/json' },
    });
  });

  test('retries after a network error', async () => {
    const fetch = jest
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse(200, PAYLOAD));

    const products = await loadProducts({ fetch });
    expect(products).toHaveLength(2);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('gives up after the configured number of retries', async () => {
    const fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(loadProducts({ fetch, retries: 1 })).rejects.toThrow(
      'Could not load products after 2 attempts',
    );
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('fails fast with ProductLoadError when the API returns a server error', async () => {
    const fetch = jest.fn().mockResolvedValue(jsonResponse(500, { error: 'upstream timeout' }));

    expect(loadProducts({ fetch })).rejects.toThrow(ProductLoadError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
