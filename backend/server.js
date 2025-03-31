require("dotenv").config(); // Cargar variables de entorno
const express = require("express");
const cors = require("cors");
const pokemonRoutes = require("./routes/pokemon");

const app = express();
const PORT = process.env.PORT || 3000; // Usar el puerto del .env o el 3000 por defecto

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/pokemon", pokemonRoutes);

app.get("/", (req, res) => {
    res.send("Bienvenido a la API de Pokémon 🐉");
});

// Manejo de errores globales
app.use((err, req, res, next) => {
    console.error("Error en el servidor:", err);
    res.status(500).json({ error: "Error interno del servidor" });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🔥 Servidor corriendo en http://localhost:${PORT}`);
});
