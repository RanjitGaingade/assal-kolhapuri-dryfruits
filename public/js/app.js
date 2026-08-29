// ========================================
// PRODUCTS
// ========================================

let products = [];

async function loadProducts() {
  try {
    const response = await fetch("/api/products");

    if (!response.ok) {
      throw new Error(`Products API failed: ${response.status}`);
    }

    products = await response.json();

    console.log("Products loaded from API:", products);

    renderProducts();
  } catch (error) {
    console.error("Failed to load products:", error);
  }
}

// ========================================
// CART
// ========================================

let cart = JSON.parse(
  localStorage.getItem("assalCart")
) || [];


// ========================================
// RENDER PRODUCTS
// ========================================

function renderProducts() {

  const container =
    document.getElementById("productsGrid");

  if (!container) {
    console.error("productsGrid not found");
    return;
  }

  container.innerHTML = products.map(product => {

    return `
      <article class="product-card">

        <div class="product-image">

          <img
            src="${product.image}"
            alt="${product.name}"
            onerror="this.src='/images/hero.png'"
          />

        </div>

        <div class="product-info">

          <h3>${product.name}</h3>

          <div class="product-size">
            ${product.size}
          </div>

          <div class="product-price">

            ₹${product.price}

            <span class="old-price">
              ₹${product.oldPrice}
            </span>

          </div>

          <div class="product-rating">

            ★★★★★

            <span>
              ${product.rating}
            </span>

          </div>

          <button
            type="button"
            class="add-cart"
            onclick="addToCart(${product.id})"
          >
            🛒 Add to Cart
          </button>

        </div>

      </article>
    `;

  }).join("");
}


// ========================================
// ADD TO CART
// ========================================

function addToCart(productId) {

  const product =
    products.find(
      item => item.id === productId
    );

  if (!product) {

    console.error(
      "Product not found:",
      productId
    );

    return;
  }

  const existing =
    cart.find(
      item => item.id === productId
    );


  if (existing) {

    existing.quantity++;

  } else {

    cart.push({

      id: product.id,

      name: product.name,

      price: Number(product.price),

      image: product.image,

      size: product.size,

      quantity: 1

    });

  }


  saveCart();

  updateCartCount();

  renderCart();

  openCart();
}


// ========================================
// SAVE CART
// ========================================

function saveCart() {

  localStorage.setItem(
    "assalCart",
    JSON.stringify(cart)
  );
}


// ========================================
// CART COUNT
// ========================================

function updateCartCount() {

  const count =
    cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  const element =
    document.getElementById("cartCount");

  if (element) {

    element.textContent = count;

  }
}


// ========================================
// RENDER CART
// ========================================

function renderCart() {

  const container =
    document.getElementById("cartItems");

  if (!container) return;


  if (cart.length === 0) {

    container.innerHTML = `

      <div class="empty-cart">

        <div class="empty-cart-icon">
          🛒
        </div>

        <h3>
          Your cart is empty
        </h3>

        <p>
          Add some delicious dry fruits.
        </p>

        <button
          type="button"
          onclick="closeCart()"
        >
          Continue Shopping
        </button>

      </div>

    `;

    updateCartSummary();

    return;
  }


  container.innerHTML =
    cart.map(item => {

      return `

        <div class="cart-item">

          <img
            src="${item.image}"
            alt="${item.name}"
            onerror="this.src='/images/hero.png'"
          >

          <div class="cart-item-info">

            <h3>
              ${item.name}
            </h3>

            <span class="cart-item-size">
              ${item.size}
            </span>

            <strong>
              ₹${item.price}
            </strong>


            <div class="quantity-controls">

              <button
                type="button"
                onclick="decreaseQuantity(${item.id})"
              >
                −
              </button>

              <span>
                ${item.quantity}
              </span>

              <button
                type="button"
                onclick="increaseQuantity(${item.id})"
              >
                +
              </button>

            </div>

          </div>


          <div class="cart-item-right">

            <strong>
              ₹${item.price * item.quantity}
            </strong>

            <button
              type="button"
              class="remove-item"
              onclick="removeFromCart(${item.id})"
            >
              🗑️
            </button>

          </div>

        </div>

      `;

    }).join("");


  updateCartSummary();
}


// ========================================
// INCREASE QUANTITY
// ========================================

function increaseQuantity(id) {

  const item =
    cart.find(
      product => product.id === id
    );

  if (!item) return;


  item.quantity++;


  saveCart();

  updateCartCount();

  renderCart();
}


// ========================================
// DECREASE QUANTITY
// ========================================

function decreaseQuantity(id) {

  const item =
    cart.find(
      product => product.id === id
    );

  if (!item) return;


  if (item.quantity > 1) {

    item.quantity--;

  } else {

    removeFromCart(id);

    return;

  }


  saveCart();

  updateCartCount();

  renderCart();
}


// ========================================
// REMOVE PRODUCT
// ========================================

function removeFromCart(id) {

  cart =
    cart.filter(
      item => item.id !== id
    );


  saveCart();

  updateCartCount();

  renderCart();
}


// ========================================
// CART TOTAL
// ========================================

function updateCartSummary() {

  const subtotal =
    cart.reduce(
      (total, item) =>
        total +
        item.price * item.quantity,
      0
    );


  // FREE DELIVERY ABOVE ₹999
  const delivery =
    subtotal === 0
      ? 0
      : subtotal >= 999
        ? 0
        : 50;


  const total =
    subtotal + delivery;


  const subtotalElement =
    document.getElementById(
      "cartSubtotal"
    );


  const deliveryElement =
    document.getElementById(
      "cartDelivery"
    );


  const totalElement =
    document.getElementById(
      "cartTotal"
    );


  if (subtotalElement) {

    subtotalElement.textContent =
      `₹${subtotal}`;

  }


  if (deliveryElement) {

    deliveryElement.textContent =
      delivery === 0
        ? "FREE"
        : `₹${delivery}`;

  }


  if (totalElement) {

    totalElement.textContent =
      `₹${total}`;

  }
}


// ========================================
// PROCEED TO CHECKOUT
// ========================================

function proceedToCheckout() {

  // Check if cart is empty
  if (cart.length === 0) {

    alert(
      "Your cart is empty. Please add a product first."
    );

    return;
  }


  // Make sure latest cart is saved
  saveCart();


  // Close cart drawer
  closeCart();


  // Go to checkout page
  window.location.href =
    "checkout.html";
}


// ========================================
// OPEN CART
// ========================================

function openCart() {

  const drawer =
    document.getElementById(
      "cartDrawer"
    );


  const overlay =
    document.getElementById(
      "cartOverlay"
    );


  if (drawer) {

    drawer.classList.add(
      "active"
    );

  }


  if (overlay) {

    overlay.classList.add(
      "active"
    );

  }


  document.body.classList.add(
    "cart-open"
  );
}


// ========================================
// CLOSE CART
// ========================================

function closeCart() {

  const drawer =
    document.getElementById(
      "cartDrawer"
    );


  const overlay =
    document.getElementById(
      "cartOverlay"
    );


  if (drawer) {

    drawer.classList.remove(
      "active"
    );

  }


  if (overlay) {

    overlay.classList.remove(
      "active"
    );

  }


  document.body.classList.remove(
    "cart-open"
  );
}


// ========================================
// NEWSLETTER
// ========================================

const newsletterForm =
  document.getElementById(
    "newsletterForm"
  );


if (newsletterForm) {

  newsletterForm.addEventListener(
    "submit",
    function(event) {

      event.preventDefault();


      const email =
        this.querySelector(
          "input"
        ).value;


      alert(
        `Thank you! ${email} has been subscribed.`
      );


      this.reset();

    }
  );
}

function placeOrder() {

  if (cart.length === 0) {

    alert("Your cart is empty.");

    return;
  }

  alert("Order has been placed successfully! 🎉");

  // Clear cart after successful order
  cart = [];

  saveCart();
  updateCartCount();
  renderCart();

  closeCart();
}

// ========================================
// INITIALIZE
// ========================================

loadProducts();
updateCartCount();
renderCart();
