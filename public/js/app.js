const products = [
  {
    id: 1,
    name: "Premium Almonds",
    size: "500g",
    price: 499,
    oldPrice: 599,
    image: "/images/almonds.jpg",
    rating: 4.8
  },
  {
    id: 2,
    name: "Kaju (Cashews)",
    size: "500g",
    price: 699,
    oldPrice: 799,
    image: "/images/cashews.jpg",
    rating: 4.9
  },
  {
    id: 3,
    name: "Pistachios",
    size: "250g",
    price: 599,
    oldPrice: 699,
    image: "/images/pistachios.jpg",
    rating: 4.7
  },
  {
    id: 4,
    name: "Raisins (Kishmish)",
    size: "500g",
    price: 199,
    oldPrice: 249,
    image: "/images/raisins.jpg",
    rating: 4.8
  }
];


let cartCount = 0;


function renderProducts() {

  const container = document.getElementById("productsGrid");

  container.innerHTML = products.map(product => {

    return `
      <article class="product-card">

        <div class="product-image">

          <img
            src="${product.image}"
            alt="${product.name}"
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


function addToCart(productId) {

  const product = products.find(
    item => item.id === productId
  );

  if (!product) {
    return;
  }

  cartCount++;

  document.getElementById("cartCount").textContent =
    cartCount;

  alert(`${product.name} added to cart!`);
}


document
  .getElementById("newsletterForm")
  .addEventListener("submit", function(event) {

    event.preventDefault();

    const email = this.querySelector("input").value;

    alert(`Thank you! ${email} has been subscribed.`);

    this.reset();
  });


renderProducts();
