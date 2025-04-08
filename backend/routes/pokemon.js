const express = require("express");
const router = express.Router();
const { getPokemon, getPokemonList, getPokemonAbilities, getPokemonTypes } = require("../controllers/pokemonController");

// Ruta para obtener un Pokémon por nombre o ID
router.get("/:name", getPokemon);

// Ruta para listar Pokémon con paginación
router.get("/", getPokemonList);

// Ruta para obtener habilidades de un Pokémon
router.get("/:name/abilities", getPokemonAbilities);
// Ruta para obtener tipos de un Pokémon
router.get("/:name/types", 
    (req, res, next) => {
      if (!req.params.name) {
        return res.status(400).json({ error: "Se requiere nombre o ID de Pokémon" });
      }
      next();
    },
    getPokemonTypes
  );

module.exports = router;
