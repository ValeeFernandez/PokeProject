// types/pokemonTypes.ts
export interface BasicPokemon {
    id: number;
    name: string;
    url: string;
    sprite: string;
    types?: string[];
  }
  
  export interface PokemonStats {
    hp: number;
    attack: number;
    defense: number;
    special_attack: number;
    special_defense: number;
    speed: number;
  }
  
  export interface PokemonDetails extends BasicPokemon {
    height: number;
    weight: number;
    types: string[];
    abilities: string[];
    stats: PokemonStats;
  }
  
  export interface PokemonListResponse {
    count: number;
    pokemon: BasicPokemon[];
  }
  
  export interface PokemonComparison {
    pokemon1: PokemonDetails;
    pokemon2: PokemonDetails;
    differences: PokemonStats;
  }