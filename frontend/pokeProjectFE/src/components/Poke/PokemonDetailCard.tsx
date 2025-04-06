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
  IonLabel
} from '@ionic/react';

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
  fire: "danger",
  water: "primary",
  grass: "success",
  electric: "warning",
  poison: "tertiary",
  // Añade más tipos según necesites
};

const PokeDetails: React.FC = () => {
  const { name } = useParams<RouteParams>();
  const [pokemon, setPokemon] = useState<PokemonData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`);
        const data = await response.json();

        const pokemonData: PokemonData = {
          id: data.id,
          name: data.name,
          height: data.height,
          weight: data.weight,
          types: data.types.map((t: any) => t.type.name),
          sprite: data.sprites.front_default,
          abilities: data.abilities.map((a: any) => a.ability.name),
          stats: data.stats.map((stat: any) => ({
            name: stat.stat.name,
            base: stat.base_stat
          }))
        };

        setPokemon(pokemonData);
      
    };

    fetchData();
  }, [name]);

  if (error) return <IonContent>{error}</IonContent>;
  if (!pokemon) return <IonContent><IonSpinner /></IonContent>;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            #{pokemon.id} - {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Imagen más pequeña (150px) y centrada */}
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <IonImg 
            src={pokemon.sprite} 
            alt={pokemon.name} 
            style={{ width: '150px', height: '150px' }}
          />
        </div>

        {/* Tipos */}
        <IonItem>
          <IonLabel>Tipos:</IonLabel>
          {pokemon.types.map((type, i) => (
            <IonBadge key={i} color={typeColors[type] || "medium"}>
              {type}
            </IonBadge>
          ))}
        </IonItem>

        {/* Altura y Peso */}
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonCard>
                <IonCardContent>
                  <strong>Altura:</strong> {(pokemon.height / 10).toFixed(1)} m
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol>
              <IonCard>
                <IonCardContent>
                  <strong>Peso:</strong> {(pokemon.weight / 10).toFixed(1)} kg
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Habilidades */}
        <IonCard>
          <IonCardContent>
            <h3>Habilidades:</h3>
            <ul>
              {pokemon.abilities.map((ability, i) => (
                <li key={i}>{ability}</li>
              ))}
            </ul>
          </IonCardContent>
        </IonCard>

        {/* Estadísticas */}
        <IonCard>
          <IonCardContent>
            <h3>Estadísticas:</h3>
            <IonGrid>
              {pokemon.stats.map((stat, i) => (
                <IonRow key={i}>
                  <IonCol size="6">
                    <strong>{stat.name}:</strong>
                  </IonCol>
                  <IonCol size="6">
                    {stat.base}
                  </IonCol>
                </IonRow>
              ))}
            </IonGrid>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default PokeDetails;