let allProducts = [];
let storeConfig = { storeName: "El Jardin de Dani", whatsapp: "51983508241", deliveryArea: "Consulta nuestra cobertura" };

const money = value => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);
const waLink = message => `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(message)}`;

async function loadStore() {
  try {
    const [configResponse, productsResponse] = await Promise.all([
      fetch("/api/config"), fetch("/api/products")
    ]);
    if (!configResponse.ok || !productsResponse.ok) throw new Error("No se pudo cargar la tienda");
    storeConfig = await configResponse.json();
    allProducts = await productsResponse.json();
    document.title = `${storeConfig.storeName} | Flores que hablan por ti`;
    document.querySelectorAll("#brandName,#footerBrand").forEach(el => el.textContent = storeConfig.storeName);
    document.getElementById("deliveryArea").textContent = storeConfig.deliveryArea;
    document.getElementById("mainWhatsapp").href = waLink(`Hola, quisiera información sobre los arreglos de ${storeConfig.storeName}.`);
    document.getElementById("floatingWhatsapp").href = waLink("Hola, quisiera hacer un pedido.");
    fillCategories();
    renderProducts();
  } catch (error) {
    document.getElementById("productGrid").innerHTML = '<p class="empty">No se pudo cargar el catálogo. Intenta actualizar la página.</p>';
    console.error(error);
  }
}

function fillCategories() {
  const select = document.getElementById("categoryFilter");
  [...new Set(allProducts.map(product => product.category))].sort().forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });
}

function renderProducts() {
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const filtered = allProducts.filter(p =>
    (`${p.name} ${p.description} ${p.category}`).toLowerCase().includes(query) &&
    (!category || p.category === category)
  );
  const grid = document.getElementById("productGrid");
  grid.replaceChildren();
  if (!filtered.length) {
    grid.innerHTML = '<p class="empty">No encontramos arreglos con esa búsqueda.</p>';
    return;
  }
  filtered.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";
    const image = document.createElement("img");
    image.className = "product-photo";
    image.src = product.image;
    image.alt = product.name;
    image.loading = "lazy";
    image.onerror = () => { image.src = "https://placehold.co/600x500/f2eee6/536357?text=Flores"; };
    const info = document.createElement("div");
    info.className = "product-info";
    const details = document.createElement("div");
    const name = document.createElement("h3"); name.textContent = product.name;
    const description = document.createElement("p"); description.textContent = product.description;
    details.append(name, description);
    const price = document.createElement("strong"); price.textContent = money(product.price);
    info.append(details, price);
    const order = document.createElement("a");
    order.className = "product-order";
    order.href = waLink(`Hola, quiero consultar disponibilidad del producto: ${product.name}. Precio publicado: ${money(product.price)}.`);
    order.target = "_blank"; order.rel = "noopener";
    order.innerHTML = `<span>Consultar por WhatsApp</span><span>↗</span>`;
    card.append(image, info, order);
    grid.append(card);
  });
}

document.getElementById("searchInput").addEventListener("input", renderProducts);
document.getElementById("categoryFilter").addEventListener("change", renderProducts);
loadStore();
