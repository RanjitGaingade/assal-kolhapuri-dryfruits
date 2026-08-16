const js = require("@eslint/js");

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "coverage/**"
    ]
  },

  // Node.js application
  {
    files: [
      "app.js",
      "server.js"
    ],

    ...js.configs.recommended,

    languageOptions: {
      globals: {
        require: "readonly",
        module: "readonly",
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly"
      }
    }
  },

  // Browser JavaScript
  {
    files: [
      "public/js/**/*.js"
    ],

    ...js.configs.recommended,

    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        alert: "readonly",
        console: "readonly",

        // Functions called from HTML onclick=""
        addToCart: "readonly",
        increaseQuantity: "readonly",
        decreaseQuantity: "readonly",
        proceedToCheckout: "readonly",
        placeOrder: "readonly"
      }
    },

    rules: {
      "no-unused-vars": [
        "error",
        {
          "varsIgnorePattern": "^(addToCart|increaseQuantity|decreaseQuantity|proceedToCheckout|placeOrder)$"
        }
      ]
    }
  },

  // Jest tests
  {
    files: [
      "tests/**/*.js"
    ],

    ...js.configs.recommended,

    languageOptions: {
      globals: {
        require: "readonly",

        jest: "readonly",
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly"
      }
    }
  }
];