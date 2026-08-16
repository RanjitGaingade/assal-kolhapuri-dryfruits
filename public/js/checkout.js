const cart =
  JSON.parse(
    localStorage.getItem("assalCart")
  ) || [];


// ========================================
// CHECK CART
// ========================================

if (cart.length === 0) {

  alert(
    "Your cart is empty."
  );

  window.location.href =
    "index.html";

}


// ========================================
// RENDER CHECKOUT
// ========================================

function renderCheckout() {

  const container =
    document.getElementById(
      "checkoutItems"
    );

  if (!container) return;


  container.innerHTML =
    cart.map(item => {

      return `
        <div class="checkout-item">

          <img
            src="${item.image}"
            alt="${item.name}"
          >

          <div>

            <h3>
              ${item.name}
            </h3>

            <p>
              ${item.size}
              × ${item.quantity}
            </p>

            <strong>
              ₹${item.price * item.quantity}
            </strong>

          </div>

        </div>
      `;

    }).join("");


  updateTotals();
}


// ========================================
// TOTALS
// ========================================

function updateTotals() {

  const subtotal =
    cart.reduce(
      (total, item) =>
        total +
        item.price * item.quantity,
      0
    );


  const delivery =
    subtotal >= 999
      ? 0
      : 50;


  const total =
    subtotal + delivery;


  document.getElementById(
    "checkoutSubtotal"
  ).textContent =
    `₹${subtotal}`;


  document.getElementById(
    "checkoutDelivery"
  ).textContent =
    delivery === 0
      ? "FREE"
      : `₹${delivery}`;


  document.getElementById(
    "checkoutTotal"
  ).textContent =
    `₹${total}`;
}


// ========================================
// PLACE ORDER
// ========================================

document
  .getElementById("checkoutForm")
  .addEventListener(
    "submit",
    function(event) {

      event.preventDefault();


      const customerName =
        document.getElementById(
          "customerName"
        ).value.trim();


      const mobile =
        document.getElementById(
          "mobile"
        ).value.trim();


      const address =
        document.getElementById(
          "address"
        ).value.trim();


      const city =
        document.getElementById(
          "city"
        ).value.trim();


      const pincode =
        document.getElementById(
          "pincode"
        ).value.trim();


      if (
        !customerName ||
        !mobile ||
        !address ||
        !city ||
        !pincode
      ) {

        alert(
          "Please fill all delivery details."
        );

        return;
      }


      const subtotal =
        cart.reduce(
          (total, item) =>
            total +
            item.price * item.quantity,
          0
        );


      const delivery =
        subtotal >= 999
          ? 0
          : 50;


      const total =
        subtotal + delivery;


      const order = {

        customer: {
          name: customerName,
          mobile: mobile,
          address: address,
          city: city,
          pincode: pincode
        },

        products: cart,

        subtotal: subtotal,

        delivery: delivery,

        total: total,

        date:
          new Date().toISOString()

      };


      localStorage.setItem(
        "assalLastOrder",
        JSON.stringify(order)
      );


      alert(
        `Thank you ${customerName}!\n\n` +
        `Your order has been placed.\n\n` +
        `Order Total: ₹${total}`
      );


      // Clear cart
      localStorage.removeItem(
        "assalCart"
      );


      // Return home
      window.location.href =
        "index.html";

    }
  );


// ========================================
// START
// ========================================

renderCheckout();