import os
import sqlite3
from functools import wraps
from flask import Flask, jsonify, render_template, request, redirect, url_for, session, flash, send_from_directory


BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.environ.get(
    "DATABASE_PATH",
    os.path.join(BASE_DIR, "floreria.db")
)
app = Flask(__name__)
@app.route("/sitemap.xml")
def sitemap():
    return send_from_directory(
        BASE_DIR,
        "sitemap.xml",
        mimetype="application/xml"
    )
@app.route("/robots.txt")
def robots():
    return send_from_directory(
        BASE_DIR,
        "robots.txt",
        mimetype="text/plain"
    )
app.secret_key = os.environ.get("SECRET_KEY", "cambia-esta-clave-antes-de-publicar")
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get("COOKIE_SECURE", "0") == "1",
)

def db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection

def init_db():
    with db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                price REAL NOT NULL CHECK(price >= 0),
                category TEXT NOT NULL DEFAULT 'Ramos',
                image TEXT NOT NULL DEFAULT '',
                active INTEGER NOT NULL DEFAULT 1
            )
        """)
        count = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
        if count == 0:
            demo = [
                ("Ramo de rosas", "Rosas frescas con envoltura elegante.", 89, "Ramos",
                 "https://images.unsplash.com/photo-1548094967-e25a127d1d3d?auto=format&fit=crop&w=800&q=85"),
                ("Tulipanes delicados", "Color y alegría en un ramo especial.", 110, "Ramos",
                 "https://images.unsplash.com/photo-1520763185298-1b434c919e76?auto=format&fit=crop&w=800&q=85"),
                ("Sol de girasoles", "Un detalle lleno de energía y luz.", 75, "Ramos",
                 "https://images.unsplash.com/photo-1597848212624-e6b2b7e7b5b5?auto=format&fit=crop&w=800&q=85"),
                ("Box romántico", "Flores en caja para sorprender.", 135, "Cajas",
                 "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=800&q=85"),
            ]
            conn.executemany(
                "INSERT INTO products(name, description, price, category, image) VALUES(?,?,?,?,?)",
                demo
            )

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get("admin_logged_in"):
            if request.path.startswith("/api/"):
                return jsonify({"error": "Debes iniciar sesión como administrador."}), 401
            return redirect(url_for("admin_login"))
        return fn(*args, **kwargs)
    return wrapper

@app.get("/")
def home():
    return render_template("index.html")

@app.get("/api/config")
def public_config():
    return jsonify({
        "storeName": os.environ.get("STORE_NAME", "El Jardin de Dani"),
        "whatsapp": os.environ.get("WHATSAPP_NUMBER", "51983508241"),
        "deliveryArea": os.environ.get("DELIVERY_AREA", "Consulta nuestra cobertura"),
    })

@app.get("/api/products")
def get_products():
    with db() as conn:
        rows = conn.execute(
            "SELECT id, name, description, price, category, image FROM products WHERE active=1 ORDER BY id DESC"
        ).fetchall()
    return jsonify([dict(row) for row in rows])

@app.get("/admin")
def admin_login():
    if session.get("admin_logged_in"):
        return render_template("admin.html")
    return render_template("login.html")

@app.post("/admin/login")
def login():
    password = os.environ.get("ADMIN_PASSWORD")
    if not password:
        flash("Configura la variable ADMIN_PASSWORD antes de entrar al panel.", "error")
        return redirect(url_for("admin_login"))
    if request.form.get("password", "") == password:
        session["admin_logged_in"] = True
        return redirect(url_for("admin_login"))
    flash("Contraseña incorrecta.", "error")
    return redirect(url_for("admin_login"))

@app.post("/admin/logout")
def logout():
    session.clear()
    return redirect(url_for("home"))

def validate_product(data):
    required = ["name", "description", "category", "image", "price"]
    if not isinstance(data, dict) or any(key not in data for key in required):
        return "Completa todos los campos."
    try:
        price = float(data["price"])
    except (TypeError, ValueError):
        return "El precio debe ser un número."
    if not data["name"].strip() or price < 0:
        return "El nombre es obligatorio y el precio no puede ser negativo."
    if len(data["name"]) > 80 or len(data["description"]) > 240:
        return "El nombre o la descripción son demasiado largos."
    return None

@app.post("/api/products")
@admin_required
def create_product():
    data = request.get_json(silent=True) or {}
    error = validate_product(data)
    if error:
        return jsonify({"error": error}), 400
    with db() as conn:
        cur = conn.execute(
            "INSERT INTO products(name, description, price, category, image) VALUES(?,?,?,?,?)",
            (data["name"].strip(), data["description"].strip(), float(data["price"]),
             data["category"].strip(), data["image"].strip())
        )
        product_id = cur.lastrowid
    return jsonify({"id": product_id, "message": "Producto agregado."}), 201

@app.put("/api/products/<int:product_id>")
@admin_required
def update_product(product_id):
    data = request.get_json(silent=True) or {}
    error = validate_product(data)
    if error:
        return jsonify({"error": error}), 400
    with db() as conn:
        cur = conn.execute(
            """UPDATE products SET name=?, description=?, price=?, category=?, image=?
               WHERE id=?""",
            (data["name"].strip(), data["description"].strip(), float(data["price"]),
             data["category"].strip(), data["image"].strip(), product_id)
        )
        if cur.rowcount == 0:
            return jsonify({"error": "Producto no encontrado."}), 404
    return jsonify({"message": "Producto actualizado."})

@app.delete("/api/products/<int:product_id>")
@admin_required
def delete_product(product_id):
    with db() as conn:
        cur = conn.execute("DELETE FROM products WHERE id=?", (product_id,))
        if cur.rowcount == 0:
            return jsonify({"error": "Producto no encontrado."}), 404
    return jsonify({"message": "Producto eliminado."})

init_db()

if __name__ == "__main__":
    app.run(debug=False)