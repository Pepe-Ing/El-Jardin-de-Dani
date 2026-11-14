const form = document.getElementById("productForm");
const message = document.getElementById("formMessage");
let products = [];
const fields = ["name", "description", "price", "category", "image"];
const value = id => document.getElementById(id).value.trim();

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Ocurrió un error.");
  return data;
}

async function loadProducts() {
  try {
    products = await request("/api/products");
    const container = document.getElementById("adminProducts");
    container.replaceChildren();
    if (!products.length) container.textContent = "Todavía no hay productos.";
    products.forEach(product => {
      const item = document.createElement("div"); item.className = "admin-item";
      const img = document.createElement("img"); img.src = product.image; img.alt = product.name;
      const details = document.createElement("div"); details.className = "details";
      const name = document.createElement("b"); name.textContent = product.name;
      const price = document.createElement("small"); price.textContent = `S/ ${Number(product.price).toFixed(2)} · ${product.category}`;
      details.append(name, price);
      const edit = document.createElement("button"); edit.className = "edit"; edit.textContent = "Editar";
      edit.addEventListener("click", () => editProduct(product));
      const remove = document.createElement("button"); remove.className = "delete"; remove.textContent = "Eliminar";
      remove.addEventListener("click", () => removeProduct(product.id));
      item.append(img, details, edit, remove); container.append(item);
    });
  } catch (error) { message.textContent = error.message; }
}

function editProduct(product) {
  document.getElementById("productId").value = product.id;
  fields.forEach(field => document.getElementById(field).value = product[field]);
  document.getElementById("formTitle").textContent = "Editar arreglo";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearForm() {
  form.reset();
  document.getElementById("productId").value = "";
  document.getElementById("formTitle").textContent = "Agregar un arreglo";
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const id = document.getElementById("productId").value;
  const data = Object.fromEntries(fields.map(field => [field, value(field)]));
  try {
    const result = await request(id ? `/api/products/${id}` : "/api/products", {
      method: id ? "PUT" : "POST", body: JSON.stringify(data)
    });
    message.textContent = result.message;
    clearForm();
    await loadProducts();
  } catch (error) { message.textContent = error.message; }
});

async function removeProduct(id) {
  if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
  try {
    await request(`/api/products/${id}`, { method: "DELETE" });
    await loadProducts();
  } catch (error) { message.textContent = error.message; }
}

document.getElementById("cancelEdit").addEventListener("click", clearForm);
loadProducts();


document.addEventListener("change", async function (evento) {
    if (evento.target.id !== "imageFileUpload") {
        return;
    }

    const archivo = evento.target.files[0];
    const mensaje = document.getElementById("imageUploadMessage");
    const campoUrl = document.querySelector("[data-upload-url]");

    if (!archivo || !mensaje || !campoUrl) {
        return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
        mensaje.textContent = "La imagen supera 5 MB.";
        return;
    }

    const datos = new FormData();
    datos.append("image", archivo);

    mensaje.textContent = "Subiendo fotografía...";

    try {
        const respuesta = await fetch("/api/admin/upload-image", {
            method: "POST",
            body: datos,
            credentials: "same-origin"
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.error || "Error al subir la imagen"
            );
        }

        campoUrl.value = resultado.url;

        campoUrl.dispatchEvent(
            new Event("input", { bubbles: true })
        );

        campoUrl.dispatchEvent(
            new Event("change", { bubbles: true })
        );

        mensaje.textContent =
            "Fotografía subida correctamente. Ahora guarda el producto.";

    } catch (error) {
        mensaje.textContent = error.message;
    }
});

