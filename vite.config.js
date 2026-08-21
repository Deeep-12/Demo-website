import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        cart: resolve(__dirname, 'cart.html'),
        checkout: resolve(__dirname, 'checkout.html'),
        contact: resolve(__dirname, 'contact.html'),
        products: resolve(__dirname, 'products.html'),
        product: resolve(__dirname, 'product.html'),
        thankyou: resolve(__dirname, 'thankyou.html')
      }
    }
  }
});
