import React, { useEffect, useState } from 'react';
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
import './PokeDetail.css';

interface PokemonData {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: string[];
  sprite: string;
  abilities: string[];
  stats: {
    name: string;
    base: number;
  }[];
}

interface RouteParams {
  name: string;
}

const typeColors: Record<string, string> = {
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

  useIonViewWillEnter(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`);
        const data = await response.json();

        const pokemonData: PokemonData = {
          id: data.id,
          name: data.name,
          height: data.height,
          weight: data.weight,
          types: data.types.map((t: any) => t.type.name),
          sprite: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
          abilities: data.abilities.map((a: any) => a.ability.name),
          stats: data.stats.map((stat: any) => ({
            name: stat.stat.name,
            base: stat.base_stat
          }))
        };

        setPokemon(pokemonData);
      } catch (err) {
        setError("Error al cargar los datos del Pokémon");
      }
    };

    fetchData();
  }, [name]);

  if (error) {
    return (
      <>
        <Sidebar />
        <IonPage id="main-content">
          <TopBar title="PokeLab" />
          <IonContent className="error-content">{error}</IonContent>
        </IonPage>
      </>
    );
  }

  if (!pokemon) {
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

  return (
    <>
      {!isMobile && <Sidebar />}

      <IonPage id="main-content">
        <TopBar title="PokeLab" />

        <IonContent className="ion-padding poke-detail-content">
          <div className="pokemon-header">
            <IonTitle className='poke-title'>
              #{pokemon.id} - {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
            </IonTitle>

            <div className="pokemon-image-container">
              <IonImg
                src={pokemon.sprite}
                className='pokemon-img'
                alt={`Sprite de ${pokemon.name}`}
              />
            </div>
          </div>

          <div className="pokemon-details-grid">
            {/* Tipos */}
            <div className='info-container types-container'>
              <IonItem lines="none">
                <IonLabel className='section-title'>Tipos:</IonLabel>
                <div className="badges-container">
                  {pokemon.types.map((type, i) => (
                    <IonBadge
                      key={i}
                      className="type-badge"
                      style={{ backgroundColor: typeColors[type] || "#777" }}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
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
                      <p key={i} className='ability-item'>
                        {ability}
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
                      <div key={i} className="stat-item">
                        <div className="stat-info">
                          <span className="stat-name">{stat.name.replace('-', ' ')}:</span>
                          <span className="stat-value">{stat.base}</span>
                        </div>
                        <div className="stat-bar-container">
                          <div
                            className="stat-bar"
                            style={{
                              width: `${(stat.base / 255) * 100}%`,
                              backgroundColor: typeColors[pokemon.types[0]] || "#4a7c99",
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
        </IonContent>
      </IonPage>
    </>
  );
};

export default PokeDetails;
