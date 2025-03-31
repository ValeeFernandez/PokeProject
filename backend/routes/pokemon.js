const express = require("express");
const router = express.Router();
const { getPokemon, getPokemonList, getPokemonAbilities } = require("../controllers/pokemonController");

// Ruta para obtener un Pokémon por nombre o ID
router.get("/:name", getPokemon);

// Ruta para listar Pokémon con paginación
router.get("/", getPokemonList);

// Ruta para obtener habilidades de un Pokémon
router.get("/:name/abilities", getPokemonAbilities);

module.exports = router;
