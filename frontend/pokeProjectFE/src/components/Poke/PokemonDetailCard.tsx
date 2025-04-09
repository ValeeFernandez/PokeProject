import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonImg,
  IonBadge,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  useIonViewWillEnter
} from '@ionic/react';
import TopBar from '../TopBar/TopBar';
import Sidebar from '../Sidebar/Sidebar';
import { fetchPokemonDetails } from '../../services/PokemonService';
import './PokeDetail.css';
import { isOnline } from '../../services/PokemonService';

// Definición de tipos mejorada
type PokemonStat = {
  name: string;
  base: number;
};

type PokemonData = {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: string[];
  sprite: string;
  abilities: string[];
  stats: PokemonStat[];
  __fallback?: boolean;
};

type RouteParams = {
  name: string;
};

// Objeto de colores para tipos con tipo seguro
const TYPE_COLORS: Record<string, string> = {
  normal: "#A69F95",
  fire: "#F2B950",
  water: "#4A7C99",
  electric: "#F0AD24",
  grass: "#94A386",
  ice: "#98D8D8",
  fighting: "#841617",
  poison: "#624C73",
  ground: "#BFB38F",
  flying: "#7E5EF2",
  psychic: "#F85888",
  bug: "#89A666",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#D9B2A9",
  unknown: "#777",
  shadow: "#5A4968"
};

const PokeDetails: React.FC = () => {
  const { name } = useParams<RouteParams>();
  const [pokemon, setPokemon] = useState<PokemonData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Manejo del resize con useCallback para mejor performance
  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  useIonViewWillEnter(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  // Función para formatear el nombre del Pokémon
  const formatPokemonName = (name: string): string => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Función para formatear el nombre de las estadísticas
  const formatStatName = (name: string): string => {
    return name.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Efecto para cargar los datos del Pokémon
  useEffect(() => {
    const loadPokemonData = async () => {
      try {
        const data = await fetchPokemonDetails(name);
        
        if (data.__fallback) {
          console.warn('Usando datos cacheados en modo offline');
        }
    
        const pokemonData: PokemonData = {
          id: data.id,
          name: data.name,
          height: data.height,
          weight: data.weight,
          types: data.types || [],
          sprite: data.sprite || '',
          abilities: data.abilities || [],
          stats: data.stats || [],
          __fallback: data.__fallback
        };
        
        setPokemon(pokemonData);
        setError(null);
      } catch (err) {
        console.error('Error fetching Pokémon details:', err);
        setError("No se pudo cargar la información del Pokémon. " + 
                 (isOnline() ? "Intenta nuevamente más tarde." : "Estás en modo offline."));
        setPokemon(null);
      }
    };

    loadPokemonData();
  }, [name]);

  // Renderizado de carga
  if (!pokemon && !error) {
    return (
      <>
        <Sidebar />
        <IonPage id="main-content">
          <TopBar title="PokeLab" />
          <IonContent className="loading-content">
            <IonSpinner name="crescent" />
          </IonContent>
        </IonPage>
      </>
    );
  }

  // Renderizado de error
  if (error) {
    return (
      <>
        <Sidebar />
        <IonPage id="main-content">
          <TopBar title="PokeLab" />
          <IonContent className="error-content">
            <div className="error-message">
              <p>{error}</p>
              {pokemon?.__fallback && (
                <p className="fallback-warning">
                  Mostrando información básica almacenada localmente.
                </p>
              )}
            </div>
          </IonContent>
        </IonPage>
      </>
    );
  }

  // Renderizado principal
  return (
    <>
      {!isMobile && <Sidebar />}

      <IonPage id="main-content">
        <TopBar title="PokeLab" />

        <IonContent className="ion-padding poke-detail-content">
          <div className="pokemon-header">
            <IonTitle className='poke-title'>
              #{pokemon?.id} - {pokemon && formatPokemonName(pokemon.name)}
            </IonTitle>

            <div className="pokemon-image-container">
              <IonImg
                src={pokemon?.sprite}
                className='pokemon-img'
                alt={`Sprite de ${pokemon?.name}`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/pikachuError.jpg';
                }}
              />
              {pokemon?.__fallback && (
                <div className="fallback-indicator">
                  Datos en modo offline
                </div>
              )}
            </div>
          </div>

          {pokemon && (
            <div className="pokemon-details-grid">
              {/* Tipos */}
              <div className='info-container types-container'>
                <IonItem lines="none">
                  <IonLabel className='section-title'>Tipos:</IonLabel>
                  <div className="badges-container">
                    {pokemon.types.map((type, i) => (
                      <IonBadge
                        key={`${type}-${i}`}
                        className="type-badge"
                        style={{ backgroundColor: TYPE_COLORS[type] || "#777" }}
                      >
                        {formatPokemonName(type)}
                      </IonBadge>
                    ))}
                  </div>
                </IonItem>
              </div>

              {/* Altura y Peso */}
              <IonGrid>
                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonCard className='poke-card'>
                      <IonCardContent>
                        <p className='section-title'>Altura</p>
                        <p className='info-text'>{(pokemon.height / 10).toFixed(1)} m</p>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                  <IonCol size="12" sizeMd="6">
                    <IonCard className='poke-card'>
                      <IonCardContent>
                        <p className='section-title'>Peso</p>
                        <p className='info-text'>{(pokemon.weight / 10).toFixed(1)} kg</p>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                </IonRow>
              </IonGrid>

              {/* Habilidades */}
              <div className='info-container abilities-container'>
                <IonCard className='poke-card'>
                  <IonCardContent>
                    <h3 className='section-title'>Habilidades</h3>
                    <div className="abilities-list">
                      {pokemon.abilities.map((ability, i) => (
                        <p key={`${ability}-${i}`} className='ability-item'>
                          {formatPokemonName(ability)}
                        </p>
                      ))}
                    </div>
                  </IonCardContent>
                </IonCard>
              </div>

              {/* Estadísticas */}
              <div className='info-container stats-container'>
                <IonCard className='poke-card'>
                  <IonCardContent>
                    <h3 className='section-title'>Estadísticas</h3>
                    <div className="stats-list">
                      {pokemon.stats.map((stat, i) => (
                        <div key={`${stat.name}-${i}`} className="stat-item">
                          <div className="stat-info">
                            <span className="stat-name">
                              {formatStatName(stat.name)}:
                            </span>
                            <span className="stat-value">{stat.base}</span>
                          </div>
                          <div className="stat-bar-container">
                            <div
                              className="stat-bar"
                              style={{
                                width: `${(stat.base / 255) * 100}%`,
                                backgroundColor: TYPE_COLORS[pokemon.types[0]] || "#4a7c99",
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </IonCardContent>
                </IonCard>
              </div>
            </div>
          )}
        </IonContent>
      </IonPage>
    </>
  );
};

export default PokeDetails;