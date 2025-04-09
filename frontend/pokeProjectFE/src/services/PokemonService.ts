import axios from 'axios';

const API_URL = 'https://pokeapi.co/api/v2'; // URL base de PokeAPI
const CACHE_VERSION = 3; // Versión del caché para manejar migraciones

// Tipos de Pokémon mejorados
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
  lastUpdated?: number;
  __fallback?: boolean;
}

interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BasicPokemon[];
}

interface PokemonComparison {
  pokemon1: PokemonDetails;
  pokemon2: PokemonDetails;
  differences: {
    [stat: string]: number;
  };
}

// ==================== CACHÉ CON INDEXEDDB ====================

let dbPromise: Promise<IDBDatabase>;

const openDatabase = (): Promise<IDBDatabase> => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('PokemonCacheDB', CACHE_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('searchResults')) {
          const searchStore = db.createObjectStore('searchResults', { 
            keyPath: 'query' // Esto debe coincidir con lo que usas en saveToCache
          });
          searchStore.createIndex('timestamp', 'timestamp');
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
};

export const getFromCache = async <T>(storeName: string, key: string): Promise<T | null> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result) {
          // Verificar si los datos están obsoletos (más de 1 día)
          if (request.result.lastUpdated && 
              Date.now() - request.result.lastUpdated > 86400000) {
            resolve(null); // Considerar obsoleto
          } else {
            resolve(request.result.value || request.result);
          }
        } else {
          resolve(null);
        }
      };
      request.onerror = () => {
        console.error(`Error al leer de ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error en getFromCache:', error);
    return null;
  }
};

export const saveToCache = async (storeName: string, key: string, value: any): Promise<void> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      // Preparar datos según el tipo de store
      let dataToSave;
      if (storeName === 'pokemon') {
        dataToSave = { 
          name: key.toLowerCase(),
          id: value.id,
          ...value,
          lastUpdated: Date.now()
        };
      } else if (storeName === 'searchResults') {
        // Asegúrate que el objeto tenga la propiedad que coincide con el keyPath
        dataToSave = {
          query: key,  // Esto debe coincidir con el keyPath del object store
          results: value.results || value,
          timestamp: Date.now()
        };
      } else {
        dataToSave = {
          key,
          value,
          timestamp: Date.now()
        };
      }

      const request = store.put(dataToSave);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error(`Error al guardar en ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error en saveToCache:', error);
    throw error;
  }
};

// ==================== CACHÉ EN MEMORIA ====================

const searchCache = new Map<string, PokemonDetails[]>();
const pokemonCache = new Map<string, PokemonDetails>();
let fullPokemonList: BasicPokemon[] = [];

// ==================== FUNCIONES DE UTILIDAD ====================

export const isOnline = (): boolean => navigator.onLine;

const getPokemonSprite = (id: number): string => {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
};

const normalizePokemonName = (name: string): string => {
  return name.toLowerCase().trim();
};

// ==================== FUNCIONES PRINCIPALES ====================

export const getFullPokemonList = async (forceUpdate = false): Promise<BasicPokemon[]> => {
  // 1. Verificar caché en memoria
  if (!forceUpdate && fullPokemonList.length > 0) {
    return fullPokemonList;
  }

  // 2. Verificar IndexedDB
  if (!forceUpdate) {
    const cachedList = await getFromCache<BasicPokemon[]>('pokemonList', 'fullList');
    if (cachedList) {
      fullPokemonList = cachedList;
      return fullPokemonList;
    }
  }

  // 3. Obtener de la API si hay conexión
  if (isOnline()) {
    try {
      const response = await axios.get(`${API_URL}/pokemon?limit=2000`);
      const results = response.data.results;

      fullPokemonList = results.map((pokemon: any, index: number) => {
        const id = index + 1;
        return {
          id,
          name: pokemon.name,
          url: pokemon.url,
          sprite: getPokemonSprite(id)
        };
      });

      // Guardar en caché
      await saveToCache('pokemonList', 'fullList', fullPokemonList);
      return fullPokemonList;
    } catch (error) {
      console.error('Error al obtener lista completa:', error);
      throw error;
    }
  }

  // 4. Fallback si estamos offline
  return fullPokemonList.length > 0 ? fullPokemonList : [];
};

export const fetchPokemonDetails = async (identifier: string | number): Promise<PokemonDetails> => {
  const key = typeof identifier === 'number' ? identifier.toString() : normalizePokemonName(identifier);

  try {
    // 1. Verificar caché en memoria
    if (pokemonCache.has(key)) {
      return pokemonCache.get(key)!;
    }

    // 2. Verificar IndexedDB
    const cachedData = await getFromCache<PokemonDetails>('pokemon', key);
    if (cachedData && !cachedData.__fallback) {
      pokemonCache.set(key, cachedData);
      return cachedData;
    }

    // 3. Obtener de la API si hay conexión
    if (isOnline()) {
      const response = await axios.get(`${API_URL}/pokemon/${key}`);
      const data = response.data;

      const pokemonDetails: PokemonDetails = {
        id: data.id,
        name: data.name,
        url: `${API_URL}/pokemon/${data.id}`,
        sprite: data.sprites?.other?.['official-artwork']?.front_default || getPokemonSprite(data.id),
        height: data.height / 10,
        weight: data.weight / 10,
        types: data.types.map((t: any) => t.type.name),
        abilities: data.abilities.map((a: any) => a.ability.name),
        stats: data.stats.map((s: any) => ({
          name: s.stat.name,
          base: s.base_stat
        })),
        lastUpdated: Date.now()
      };

      // Guardar en caché
      try {
        pokemonCache.set(key, pokemonDetails);
        await saveToCache('pokemon', key, pokemonDetails);
      } catch (cacheError) {
        console.error('Error al guardar en caché:', cacheError);
      }
      
      return pokemonDetails;
    }

    // 4. Si estamos offline y hay datos cacheados (aunque sean fallback)
    if (cachedData) {
      return cachedData;
    }

    // 5. Crear datos de fallback
    return createFallbackPokemon(identifier);
  } catch (error) {
    console.error(`Error al obtener detalles de ${key}:`, error);
    
    // Si es un 404, guardar en caché como no encontrado
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      const fallbackData = createFallbackPokemon(identifier);
      try {
        await saveToCache('pokemon', key, fallbackData);
      } catch (cacheError) {
        console.error('Error al guardar fallback:', cacheError);
      }
      return fallbackData;
    }
    
    throw error;
  }
};

const createFallbackPokemon = (identifier: string | number): PokemonDetails & { __fallback: boolean } => {
  const id = typeof identifier === 'number' ? identifier : parseInt(identifier, 10) || 0;
  const name = typeof identifier === 'string' ? identifier : `pokemon-${identifier}`;
  
  return {
    id,
    name,
    url: `${API_URL}/pokemon/${id}`,
    sprite: getPokemonSprite(id),
    height: 0,
    weight: 0,
    types: [],
    abilities: [],
    stats: [],
    lastUpdated: Date.now(),
    __fallback: true
  };
};

export const searchPokemon = async (query: string): Promise<PokemonDetails[]> => {
  if (!query.trim()) return [];

  const normalizedQuery = normalizePokemonName(query);
  const cacheKey = `search:${normalizedQuery}`;

  try {
    const allPokemon = await getFullPokemonList();
    const isNumericSearch = !isNaN(Number(query));

    const basicResults = allPokemon.filter(pokemon => {
      if (isNumericSearch) {
        return pokemon.id.toString().includes(query);
      }
      return pokemon.name.toLowerCase().includes(normalizedQuery);
    });

    const detailedResults = await Promise.all(
      basicResults.map(async pokemon => {
        try {
          return await fetchPokemonDetails(pokemon.id);
        } catch (error) {
          console.error(`Error obteniendo detalles para ${pokemon.name}:`, error);
          return null;
        }
      })
    );

    const validResults = detailedResults.filter((result): result is PokemonDetails => result !== null);

    // Guardar en caché solo si hay resultados válidos
    if (validResults.length > 0) {
      try {
        await saveToCache('searchResults', cacheKey, {
          query: cacheKey,  // Asegura que tenemos el keyPath requerido
          results: validResults,
          timestamp: Date.now()
        });
      } catch (cacheError) {
        console.error('Error al guardar resultados de búsqueda:', cacheError);
      }
    }

    return validResults;
  } catch (error) {
    console.error('Error en la búsqueda:', error);
    return [];
  }
};

export const fetchPokemonList = async (limit: number = 20, offset: number = 0): Promise<PokemonListResponse> => {
  try {
    const response = await axios.get(`${API_URL}/pokemon?limit=${limit}&offset=${offset}`);
    return {
      count: response.data.count,
      next: response.data.next,
      previous: response.data.previous,
      results: response.data.results
    };
  } catch (error) {
    console.error('Error al obtener lista paginada:', error);
    throw error;
  }
};

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

// ==================== FUNCIONES DE MANTENIMIENTO ====================

export const clearCache = async (): Promise<void> => {
  try {
    // Limpiar caché en memoria
    searchCache.clear();
    pokemonCache.clear();
    fullPokemonList = [];

    // Limpiar IndexedDB
    const db = await openDatabase();
    const storeNames = ['pokemon', 'pokemonList', 'searchResults'];
    
    await Promise.all(
      storeNames.map(storeName => {
        return new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.clear();

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      })
    );

    console.log('Caché limpiado exitosamente');
  } catch (error) {
    console.error('Error al limpiar el caché:', error);
    throw error;
  }
};

export const preloadPokemonData = async (ids: number[]): Promise<void> => {
  if (!isOnline()) return;

  try {
    await Promise.all(
      ids.map(id => fetchPokemonDetails(id).catch(() => null))
    );
    console.log(`Precarga completada para ${ids.length} Pokémon`);
  } catch (error) {
    console.error('Error en precarga:', error);
  }
};


