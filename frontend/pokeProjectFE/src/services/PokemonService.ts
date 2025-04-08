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

// Cache mejorado con IndexedDB
export const openCacheDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('PokeCacheDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('pokemon')) {
        db.createObjectStore('pokemon', { keyPath: 'name' });
      }
      if (!db.objectStoreNames.contains('pokemonList')) {
        db.createObjectStore('pokemonList', { keyPath: 'key' });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getFromCache = async (storeName: string, key: string) => {
  try {
    const db = await openCacheDB();
    return new Promise<any>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result?.value || request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error accessing cache:', error);
    return null;
  }
};

export const saveToCache = async (storeName: string, key: string, value: any) => {
  try {
    const db = await openCacheDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      if (storeName === 'pokemon') {
        // Guarda el objeto completo SIN sobrescribir el nombre
        store.put({ 
          ...value,
          id: value.id,          // Asegura que el ID esté presente
          name: value.name,      // Conserva el nombre original
          sprite: value.sprite,  // Conserva el sprite
          types: value.types     // Conserva los tipos
        });
      } else {
        store.put({ key, value });
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Error saving to cache:', error);
    throw error; // Es importante propagar el error
  }
};


// Implementación de caché en memoria
const searchCache = new Map<string, PokemonDetails[]>();
let cachedPokemonList: BasicPokemon[] = [];

// Función para verificar conexión
const isOnline = () => navigator.onLine;

/**
 * Obtiene la lista completa de Pokémon (con caché mejorado)
 */
const getFullPokemonList = async (): Promise<BasicPokemon[]> => {
  // Primero intentamos obtener de caché en memoria
  if (cachedPokemonList.length > 0) return cachedPokemonList;
  
  // Luego intentamos obtener de IndexedDB
  const cachedList = await getFromCache('pokemonList', 'fullList');
  if (cachedList) {
    cachedPokemonList = cachedList;
    return cachedPokemonList;
  }

  // Solo intentamos red si estamos online
  if (isOnline()) {
    try {
      const response = await axios.get(`${API_URL}?limit=1000&offset=0`);
      cachedPokemonList = response.data.pokemon.map((p: any) => ({
        id: p.id,
        name: p.name,
        url: p.url || `${API_URL}/${p.name}`,
        sprite: p.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`
      }));
      
      // Guardamos en IndexedDB para futuras consultas offline
      await saveToCache('pokemonList', 'fullList', cachedPokemonList);
      return cachedPokemonList;
    } catch (error) {
      console.error('Error cargando lista completa de Pokémon:', error);
      return [];
    }
  }
  
  return [];
};

/**
 * Búsqueda en tiempo real con soporte offline
 */
export const searchPokemon = async (query: string): Promise<PokemonDetails[]> => {
  if (!query.trim()) return [];

  const cacheKey = query.toLowerCase();
  
  // 1. Verificar caché en memoria
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  // 2. Verificar IndexedDB
  const cachedResults = await getFromCache('pokemon', cacheKey);
  if (cachedResults) {
    return cachedResults;
  }

  // 3. Solo intentar red si estamos online
  if (isOnline()) {
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

      // Obtener detalles completos para cada resultado
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

      // Guardar en todos los niveles de caché
      searchCache.set(cacheKey, validResults);
      await saveToCache('pokemon', cacheKey, validResults);
      
      return validResults;
    } catch (error) {
      console.error('Error en la búsqueda:', error);
      return [];
    }
  }
  
  return [];
};

/**
 * Obtiene detalles de un Pokémon con soporte offline
 */
export const fetchPokemonDetails = async (nameOrId: string | number): Promise<PokemonDetails> => {
  const key = nameOrId.toString().toLowerCase();
  const defaultSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${typeof nameOrId === 'number' ? nameOrId : key.replace(/\D/g, '')}.png`;
  const defaultUrl = `${API_URL}/${key}`; // URL base para el Pokémon

  // 1. Verificar caché
  try {
    const cachedData = await getFromCache('pokemon', key);
    if (cachedData && cachedData.id) {
      return {
        id: cachedData.id,
        name: cachedData.name || `Pokémon ${cachedData.id}`,
        sprite: cachedData.sprite || defaultSprite,
        url: cachedData.url || defaultUrl, // <-- Añadido
        types: cachedData.types || [],
        height: cachedData.height || 0,
        weight: cachedData.weight || 0,
        abilities: cachedData.abilities || [],
        stats: cachedData.stats || []
      };
    }
  } catch (cacheError) {
    console.warn(`Error al leer caché para ${key}:`, cacheError);
  }

  // 2. Intentar desde la API si hay conexión
  if (navigator.onLine) {
    try {
      const response = await axios.get(`${API_URL}/${key}`);
      const data = response.data;

      const pokemonDetails: PokemonDetails = {
        id: data.id,
        name: data.name || `Pokémon ${data.id}`,
        sprite: data.sprites?.front_default || defaultSprite,
        url: `${API_URL}/${data.id}`, // <-- Añadido (o data.url si existe)
        types: data.types?.map((t: any) => t.type.name) || [],
        height: data.height || 0,
        weight: data.weight || 0,
        abilities: data.abilities?.map((a: any) => a.ability.name) || [],
        stats: data.stats?.map((s: any) => ({
          name: s.stat.name,
          base: s.base_stat
        })) || []
      };

      await saveToCache('pokemon', key, pokemonDetails);
      return pokemonDetails;
    } catch (apiError) {
      console.error(`Error en API para ${key}:`, apiError);
    }
  }

  // 3. Fallback para offline/errores
  const fallbackData: PokemonDetails = {
    id: Number(key) || 0,
    name: `Pokémon ${key}`,
    sprite: defaultSprite,
    url: defaultUrl, // <-- Añadido
    types: [],
    height: 0,
    weight: 0,
    abilities: [],
    stats: []
  };

  try {
    await saveToCache('pokemon', key, fallbackData);
  } catch (error) {
    console.warn(`Error al guardar fallback para ${key}:`, error);
  }

  return fallbackData;
};

/**
 * Obtiene lista paginada de Pokémon
 */
export const fetchPokemonList = async (limit: number = 10, offset: number = 0): Promise<PokemonListResponse> => {
  try {
    const response = await axios.get(`${API_URL}?limit=${limit}&offset=${offset}`);
    
    // Verificar si los datos están marcados como obsoletos
    if (response.data.__stale) {
      // Forzar recarga si estamos online
      if (navigator.onLine) {
        const freshResponse = await axios.get(`${API_URL}?limit=${limit}&offset=${offset}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        return freshResponse.data;
      }
    }
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.data.__stale && navigator.onLine) {
        // Intentar nuevamente sin caché
        const freshResponse = await axios.get(`${API_URL}?limit=${limit}&offset=${offset}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        return freshResponse.data;
      }
    }
    
    // Manejo de errores offline (mantén tu lógica existente)
    if (!navigator.onLine) {
      const cachedData = await getFromCache('pokemonList', `list-${limit}-${offset}`);
      if (cachedData) {
        return cachedData;
      }
    }
    
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