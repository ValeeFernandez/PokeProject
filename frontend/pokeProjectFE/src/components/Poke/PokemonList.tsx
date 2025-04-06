import { 
    IonList, IonItem, IonImg, IonLabel, IonButtons, 
    IonButton, IonSkeletonText, IonBadge, IonNote,
    IonContent, IonSearchbar, IonToolbar
  } from '@ionic/react';
  import { fetchPokemonList, searchPokemon } from '../../services/PokemonService';
  import { useState, useEffect, useRef, useCallback } from 'react';
  
  interface Pokemon {
    id: number;
    name: string;
    sprite: string;
    url: string; // ← Añadido 'url' para que coincida con PokemonDetails
    types?: string[];
    height?: number;
    weight?: number;
    abilities?: string[];
    stats?: {
      name: string;
      base: number;
    }[];
  }
  
  interface PokemonListProps {
    onListLoaded?: (list: Pokemon[]) => void;
    showCompareButton?: boolean;
    onPokemonSelected?: (pokemon: Pokemon) => void;
  }
  
  const PokemonList: React.FC<PokemonListProps> = ({ 
    onListLoaded, 
    showCompareButton = false,
    onPokemonSelected 
  }) => {
    const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
    const [filteredList, setFilteredList] = useState<Pokemon[]>([]);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchText, setSearchText] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const limit = 10;
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  
    const loadPokemons = useCallback(async (newOffset: number) => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchPokemonList(limit, newOffset);
        const formattedList = data.pokemon.map((p: any) => ({
          id: p.id,
          name: p.name,
          sprite: p.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`,
          url: p.url || '', // ← Añadido 'url' en el formato
          types: p.types || [],
          height: p.height,
          weight: p.weight,
          abilities: p.abilities || [],
          stats: p.stats || []
        }));
        
        setPokemonList(formattedList);
        setFilteredList(formattedList);
        
        if (onListLoaded) {
          onListLoaded(formattedList);
        }
      } catch (err) {
        console.error("Error loading Pokémon:", err);
        setError('Error al cargar Pokémon');
        setPokemonList([]);
        setFilteredList([]);
      } finally {
        setLoading(false);
      }
    }, [onListLoaded]);
  
    const handleSearch = useCallback(async (query: string) => {
      setSearchText(query);
      
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
  
      if (!query.trim()) {
        setIsSearching(false);
        setFilteredList(pokemonList);
        return;
      }
  
      setIsSearching(true);
      setLoading(true);
  
      searchTimeout.current = setTimeout(async () => {
        try {
          const results = await searchPokemon(query);
          const formattedResults = results.map((p: any) => ({
            id: p.id,
            name: p.name,
            sprite: p.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`,
            url: p.url || '', // ← Añadido 'url' en el formato
            types: p.types || [],
            height: p.height,
            weight: p.weight,
            abilities: p.abilities || [],
            stats: p.stats || []
          }));
          
          setFilteredList(formattedResults);
        } catch (err) {
          console.error("Error searching Pokémon:", err);
          setError('Error al buscar Pokémon');
          setFilteredList([]);
        } finally {
          setLoading(false);
        }
      }, 500);
    }, [pokemonList]);
  
    useEffect(() => {
      loadPokemons(offset);
      return () => {
        if (searchTimeout.current) {
          clearTimeout(searchTimeout.current);
        }
      };
    }, [offset, loadPokemons]);
  
    const handlePokemonClick = (pokemon: Pokemon) => {
      if (onPokemonSelected) {
        onPokemonSelected(pokemon);
      }
    };
  
    return (
      <IonContent>
        <IonToolbar>
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => handleSearch(e.detail.value!)}
            debounce={500}
            placeholder="Buscar Pokémon por nombre o número"
            animated
          />
        </IonToolbar>
  
        {loading && (
          <IonList>
            {[...Array(limit)].map((_, index) => (
              <IonItem key={`skeleton-${index}`}>
                <IonSkeletonText 
                  animated 
                  style={{ width: '50px', height: '50px' }} 
                  slot="start"
                />
                <IonLabel>
                  <h3><IonSkeletonText animated style={{ width: '80%' }} /></h3>
                  <p><IonSkeletonText animated style={{ width: '60%' }} /></p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
  
        {error && !loading && (
          <div className="ion-padding ion-text-center">
            <IonNote color="danger">{error}</IonNote>
            <IonButton 
              onClick={() => isSearching ? handleSearch(searchText) : loadPokemons(offset)}
              fill="clear"
              size="small"
            >
              Reintentar
            </IonButton>
          </div>
        )}
  
        {!loading && !error && (
          <>
            <IonList lines="full">
              {filteredList.map((pokemon) => (
                <IonItem 
                  key={pokemon.id} 
                  onClick={() => handlePokemonClick(pokemon)}
                  routerLink={!showCompareButton ? `/details/${pokemon.name}` : undefined}
                  button={showCompareButton}
                  detail={showCompareButton}
                >
                  <IonImg 
                    src={pokemon.sprite}
                    slot="start" 
                    style={{ width: '50px', height: '50px' }} 
                    alt={`${pokemon.name} sprite`}
                  />
                  <IonLabel>
                    <h2>{pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h2>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      {pokemon.types?.map((type, index) => (
                        <IonBadge 
                          key={`${type}-${index}`} 
                          color={`pokemon-${type}` as any}
                          style={{ textTransform: 'capitalize' }}
                        >
                          {type}
                        </IonBadge>
                      ))}
                    </div>
                  </IonLabel>
                  <IonNote slot="end">#{pokemon.id.toString().padStart(3, '0')}</IonNote>
                </IonItem>
              ))}
            </IonList>
  
            {!isSearching && (
              <div className="ion-padding" style={{ display: 'flex', justifyContent: 'center' }}>
                <IonButtons>
                  <IonButton 
                    onClick={() => setOffset(prev => Math.max(0, prev - limit))} 
                    disabled={offset === 0 || loading}
                    fill="outline"
                  >
                    Anterior
                  </IonButton>
                  <IonButton 
                    onClick={() => setOffset(prev => prev + limit)}
                    disabled={loading}
                    fill="outline"
                  >
                    Siguiente
                  </IonButton>
                </IonButtons>
              </div>
            )}
          </>
        )}
      </IonContent>
    );
  };
  
  
  export default PokemonList;
  