const cart = JSON.parse(localStorage.getItem("assalCart") || "[]");

// ========================================
// CHECK CART
// ========================================

if (!Array.isArray(cart) || cart.length === 0) {
  alert("Your cart is empty.");
  window.location.href = "index.html";
}

// ========================================
// HELPERS
// ========================================

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

// ========================================
// RENDER CHECKOUT
// ========================================

function renderCheckout() {
  const container = document.getElementById("checkoutItems");
  if (!container) return;

  container.innerHTML = cart.map((item) => `
    <div class="checkout-item">
      <img
        src="${escapeHtml(item.image)}"
        alt="${escapeHtml(item.name)}"
      >
      <div>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.size || item.category || "")} × ${Number(item.quantity)}</p>
        <strong>₹${(Number(item.price) * Number(item.quantity)).toFixed(2)}</strong>
      </div>
    </div>
  `).join("");

  updateTotals();
}

// ========================================
// DISPLAY ESTIMATED TOTALS
// Final totals are calculated by the server.
// ========================================

function updateTotals() {
  const subtotal = cart.reduce(
    (total, item) =>
      total + Number(item.price) * Number(item.quantity),
    0
  );

  const delivery = subtotal >= 999 ? 0 : 50;

  document.getElementById("checkoutSubtotal").textContent =
    `₹${subtotal.toFixed(2)}`;

  document.getElementById("checkoutDelivery").textContent =
    delivery === 0 ? "FREE" : `₹${delivery.toFixed(2)}`;

  document.getElementById("checkoutTotal").textContent =
    `₹${(subtotal + delivery).toFixed(2)}`;
}

// ========================================
// PLACE REAL ORDER
// ========================================

const checkoutForm = document.getElementById("checkoutForm");

if (checkoutForm) {
  checkoutForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const customerName = document.getElementById("customerName").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const address = document.getElementById("address").value.trim();
    const city = document.getElementById("city").value.trim();
    const pincode = document.getElementById("pincode").value.trim();

    if (!customerName || !mobile || !address || !city || !pincode) {
      alert("Please fill all delivery details.");
      return;
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!/^[0-9]{6}$/.test(pincode)) {
      alert("Please enter a valid 6-digit pincode.");
      return;
    }

    const submitButton = checkoutForm.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    let message = checkoutForm.querySelector("[data-checkout-message]");

    if (!message) {
      message = document.createElement("p");
      message.setAttribute("data-checkout-message", "");
      message.setAttribute("role", "alert");
      checkoutForm.appendChild(message);
    }

    if (submitButton) {
      submitButton.disabled = true;
      if (submitButton.tagName === "INPUT") {
        submitButton.value = "Placing order...";
      } else {
        submitButton.textContent = "Placing order...";
      }
    }

    message.textContent = "Submitting your order...";

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          mobile,
          address,
          city,
          pincode,
          items: cart.map((item) => ({
            id: Number(item.id),
            quantity: Number(item.quantity),
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to place your order.");
      }

      if (!result.order || !result.order.orderNumber) {
        throw new Error("The server response was incomplete. Please contact us before trying again.");
      }

      // Save only the confirmation details in the browser.
      localStorage.setItem(
        "assalLastOrder",
        JSON.stringify({
          orderNumber: result.order.orderNumber,
          status: result.order.status,
          total: result.order.total,
          date: result.order.createdAt,
        })
      );

      // Clear cart only after the server confirms the saved order.
      localStorage.removeItem("assalCart");

      alert(
        `Thank you, ${customerName}!\n\n` +
        `Your order has been saved successfully.\n\n` +
        `Order Number: ${result.order.orderNumber}\n` +
        `Order Total: ₹${Number(result.order.total).toFixed(2)}\n` +
        `Status: ${result.order.status}\n\n` +
        `Payment is not collected through this checkout.`
      );

      window.location.href = "index.html";

    } catch (error) {
      console.error("Checkout error:", error);
      message.textContent = error.message;
      alert(error.message);

      if (submitButton) {
        submitButton.disabled = false;

        if (submitButton.tagName === "INPUT") {
          submitButton.value = "Place Order";
        } else {
          submitButton.textContent = "Place Order";
        }
      }
    }
  });
}

// ========================================
// START
// ========================================

renderCheckout();
