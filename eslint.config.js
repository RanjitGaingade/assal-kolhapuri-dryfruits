const js = require("@eslint/js");

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "coverage/**",
      "dist/**",
      "build/**"
    ]
  },

  // ESLint configuration file itself
  {
    files: ["eslint.config.js"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",

      globals: {
        require: "readonly",
        module: "readonly",
        console: "readonly"
      }
    }
  },

  // Recommended JavaScript rules
  js.configs.recommended,

  // Browser JavaScript
  {
    files: ["public/js/**/*.js"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",

      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        alert: "readonly",
        console: "readonly"
      }
    },

    rules: {
      "no-undef": "error",

      "no-unused-vars": [
        "warn",
        {
          "varsIgnorePattern":
            "^(addToCart|increaseQuantity|decreaseQuantity|proceedToCheckout|placeOrder)$"
        }
      ]
    }
  },

  // Node.js / Express backend
  {
    files: [
      "server.js",
      "tests/**/*.js"
    ],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",

      globals: {
        process: "readonly",
        console: "readonly"
      }
    },

    rules: {
      "no-undef": "error",
      "no-unused-vars": "warn"
    }
  }
];
