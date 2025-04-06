import axios from 'axios';

const API_URL = 'http://localhost:3000/api/pokemon';

// Tipos de Pokémon unificados
interface PokemonStat {
  name: string;
  base: number;
}

interface BasicPokemon {
  id: number;
  name: string;
  url: string;
  sprite: string;
}

interface PokemonDetails extends BasicPokemon {
  height: number;
  weight: number;
  types: string[];
  abilities: string[];
  stats: PokemonStat[];
}

interface PokemonListResponse {
  count: number;
  pokemon: BasicPokemon[];
}

interface PokemonComparison {
  pokemon1: PokemonDetails;
  pokemon2: PokemonDetails;
  differences: {
    [stat: string]: number;
  };
}

// Implementación de caché (ahora usando PokemonDetails[])
const searchCache = new Map<string, PokemonDetails[]>();
let cachedPokemonList: BasicPokemon[] = [];

/**
 * Obtiene la lista completa de Pokémon (con caché)
 */
const getFullPokemonList = async (): Promise<BasicPokemon[]> => {
  if (cachedPokemonList.length > 0) return cachedPokemonList;

  try {
    const response = await axios.get(`${API_URL}?limit=1000&offset=0`);
    cachedPokemonList = response.data.pokemon.map((p: any) => ({
      id: p.id,
      name: p.name,
      url: p.url || `${API_URL}/${p.name}`,
      sprite: p.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`
    }));
    return cachedPokemonList;
  } catch (error) {
    console.error('Error cargando lista completa de Pokémon:', error);
    return [];
  }
};

/**
 * Búsqueda en tiempo real por nombre o número
 */
export const searchPokemon = async (query: string): Promise<PokemonDetails[]> => {
  if (!query.trim()) return [];

  const cacheKey = query.toLowerCase();
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  try {
    const allPokemon = await getFullPokemonList();
    const isNumericSearch = !isNaN(Number(query));
    const queryLower = query.toLowerCase();

    const basicResults = allPokemon.filter(pokemon => {
      if (isNumericSearch) {
        return pokemon.id.toString().includes(query);
      }
      return pokemon.name.toLowerCase().includes(queryLower);
    });

    // Obtener detalles completos para cada resultado con manejo de errores
    const detailedResults = await Promise.all(
      basicResults.map(pokemon => 
        fetchPokemonDetails(pokemon.name).catch(error => {
          console.error(`Error fetching details for ${pokemon.name}:`, error);
          return null;
        })
      )
    );

    // Filtrar resultados nulos y ordenar
    const validResults = detailedResults.filter(result => result !== null) as PokemonDetails[];
    
    validResults.sort((a, b) => {
      const aIndex = a.name.toLowerCase().indexOf(queryLower);
      const bIndex = b.name.toLowerCase().indexOf(queryLower);
      return aIndex - bIndex || a.name.localeCompare(b.name);
    });

    searchCache.set(cacheKey, validResults);
    return validResults;

  } catch (error) {
    console.error('Error en la búsqueda:', error);
    return [];
  }
};

/**
 * Obtiene lista paginada de Pokémon
 */
export const fetchPokemonList = async (limit: number = 10, offset: number = 0): Promise<PokemonListResponse> => {
  try {
    const response = await axios.get(`${API_URL}?limit=${limit}&offset=${offset}`);
    return {
      count: response.data.count,
      pokemon: response.data.pokemon.map((p: any) => ({
        id: p.id,
        name: p.name,
        url: p.url || `${API_URL}/${p.name}`,
        sprite: p.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`
      }))
    };
  } catch (error) {
    console.error('Error obteniendo lista de Pokémon:', error);
    throw error;
  }
};

/**
 * Obtiene detalles completos de un Pokémon
 */
export const fetchPokemonDetails = async (name: string): Promise<PokemonDetails> => {
  try {
    const response = await axios.get(`${API_URL}/${name.toLowerCase()}`);
    const data = response.data;
    
    // Safely map stats with proper error handling
    const stats: PokemonStat[] = [];
    if (Array.isArray(data.stats)) {
      data.stats.forEach((stat: any) => {
        try {
          if (stat && stat.stat && stat.base_stat !== undefined) {
            stats.push({
              name: stat.stat.name,
              base: stat.base_stat
            });
          }
        } catch (error) {
          console.warn(`Error processing stat for ${name}:`, stat, error);
        }
      });
    }

    return {
      id: data.id,
      name: data.name,
      url: `${API_URL}/${data.name}`,
      height: data.height || 0,
      weight: data.weight || 0,
      types: Array.isArray(data.types) ? data.types : [],
      abilities: Array.isArray(data.abilities) ? data.abilities : [],
      sprite: data.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`,
      stats: stats
    };
  } catch (error) {
    console.error(`Error obteniendo detalles de ${name}:`, error);
    throw error;
  }
};

/**
 * Compara dos Pokémon
 */
export const comparePokemon = async (name1: string, name2: string): Promise<PokemonComparison> => {
  try {
    const [pokemon1, pokemon2] = await Promise.all([
      fetchPokemonDetails(name1),
      fetchPokemonDetails(name2)
    ]);

    // Crear objeto de diferencias dinámicamente
    const differences: {[key: string]: number} = {};
    
    // Comparar cada estadística
    pokemon1.stats.forEach((stat, index) => {
      if (pokemon2.stats[index]) {
        differences[stat.name] = stat.base - pokemon2.stats[index].base;
      }
    });

    return {
      pokemon1,
      pokemon2,
      differences
    };
  } catch (error) {
    console.error('Error en la comparación:', error);
    throw error;
  }
};