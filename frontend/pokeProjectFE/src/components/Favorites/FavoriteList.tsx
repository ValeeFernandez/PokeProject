import React, { useEffect, useState, useCallback } from 'react';
import { 
  IonCard, IonCardContent, IonImg, IonNote, IonContent, 
  IonToolbar, IonButton, IonIcon, IonSkeletonText 
} from '@ionic/react';
import { star } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { fetchPokemonDetails, getFromCache } from '../../services/PokemonService';
import './favoriteList.css';

interface FavoritePokemon {
  id: number;
  name: string;
  sprite: string;
  types: string[];
}

const FavoriteList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavoritePokemon[]>([]);
  const [error, setError] = useState('');
  const history = useHistory();

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const favoritesStr = localStorage.getItem('pokemonFavorites');
      const favoriteIds = favoritesStr ? JSON.parse(favoritesStr) : [];
      
      if (favoriteIds.length === 0) {
        setFavorites([]);
        return;
      }
  
      const favoritePokemons = await Promise.all(
        favoriteIds.map(async (id: number) => {
          try {
            // 1. Primero intentar obtener del caché
            const cachedDetails = await getFromCache('pokemon', id.toString());
            if (cachedDetails) {
              // ¡Asegurar que el nombre esté presente!
              return {
                id: cachedDetails.id,
                name: cachedDetails.name || `Pokémon ${cachedDetails.id}`, // Fallback
                sprite: cachedDetails.sprite,
                types: cachedDetails.types || []
              };
            }
  
            // 2. Si no hay caché, buscar en la API
            const details = await fetchPokemonDetails(id.toString());
            return {
              id: details.id,
              name: details.name,
              sprite: details.sprite,
              types: details.types || []
            };
          } catch (error) {
            console.error(`Error loading favorite ${id}:`, error);
            // Datos mínimos de respaldo
            return {
              id,
              name: `Pokémon ${id}`,
              sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
              types: []
            };
          }
        })
      );
      
      setFavorites(favoritePokemons.filter(p => p !== null) as FavoritePokemon[]);
      
    } catch (error) {
      console.error('Error loading favorites:', error);
      setError('Error al cargar favoritos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const removeFavorite = (pokemonId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const updatedFavorites = favorites.filter(p => p.id !== pokemonId);
    // Guardar todos los datos necesarios en localStorage
    localStorage.setItem('pokemonFavorites', JSON.stringify(
      updatedFavorites.map(p => ({
        id: p.id,
        name: p.name,
        sprite: p.sprite,
        types: p.types
      }))
    ));
    setFavorites(updatedFavorites);
  };

  const handlePokemonClick = (pokemon: FavoritePokemon) => {
    history.push(`/details/${pokemon.name}`);
  };

  const renderSkeletonLoader = () => (
    <div className="pokemon-grid-container">
      {[...Array(8)].map((_, i) => (
        <IonCard key={`skeleton-${i}`} className="pokemon-card">
          <IonCardContent className="pokemon-card-content">
            <div className="pokemon-card-header">
              <div className="pokemon-number">
                N° 0000
              </div>
              <IonButton fill="clear" className="favorite-button">
                <IonIcon icon={star} color="warning" />
              </IonButton>
            </div>
            <div className="pokemon-card-content-wrapper">
              <div className="pokemon-image-container">
                <div className="pokemon-image-frame">
                  <IonSkeletonText 
                    animated 
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      borderRadius: '50%'
                    }} 
                  />
                </div>
              </div>
              <div className="pokemon-name-container">
                <IonSkeletonText animated style={{ width: '80%' }} />
              </div>
              <div className="pokemon-types-container">
                <IonSkeletonText animated style={{ width: '60px', height: '24px' }} />
              </div>
            </div>
          </IonCardContent>
        </IonCard>
      ))}
    </div>
  );

  const renderPokemonCards = () => {
    if (favorites.length === 0) {
      return (
        <div className="no-favorites">
          <IonNote>No tienes Pokémon favoritos aún</IonNote>
          <IonButton 
            fill="clear" 
            onClick={() => history.push('/')}
          >
            Explorar Pokémon
          </IonButton>
        </div>
      );
    }

    return (
      <div className="pokemon-grid-container">
        {favorites.map(pokemon => (
          <IonCard 
            key={pokemon.id} 
            className="pokemon-card"
            onClick={() => handlePokemonClick(pokemon)}
          >
            <div className="pokemon-card-header">
              <div className="pokemon-number">
                N° {pokemon.id.toString().padStart(4, '0')}
              </div>
              <IonButton 
                fill="clear" 
                className="favorite-button"
                onClick={(e) => removeFavorite(pokemon.id, e)}
              >
                <IonIcon icon={star} color="warning" />
              </IonButton>
            </div>
            
            <div className="pokemon-card-content-wrapper">
              <IonCardContent className="pokemon-card-content">
                <div className="pokemon-image-container">
                  <div className="pokemon-image-frame">
                    <IonImg 
                      src={pokemon.sprite} 
                      className="pokemon-sprite"
                      alt={`${pokemon.name} sprite`}
                    />
                  </div>
                </div>
                
                <div className="pokemon-name-container">
                  {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
                </div>
                
                <div className="pokemon-types-container">
                  {pokemon.types.map((type, index) => (
                    <div 
                      key={index}
                      className={`pokemon-type-badge type-${type.toLowerCase()}`}
                    >
                      {type.toUpperCase()}
                    </div>
                  ))}
                </div>
              </IonCardContent>
            </div>
          </IonCard>
        ))}
      </div>
    );
  };

  return (
    <IonContent className="pokemon-grid">
      <IonToolbar>
        <h2 className="favorite-title">Mis Pokémon Favoritos</h2>
      </IonToolbar>

      {error && (
        <div className="error-message">
          <IonNote color="warning">{error}</IonNote>
          <IonButton 
            onClick={loadFavorites} 
            fill="clear" 
            size="small"
          >
            Reintentar
          </IonButton>
        </div>
      )}

      {loading ? renderSkeletonLoader() : renderPokemonCards()}
    </IonContent>
  );
};

export default FavoriteList;