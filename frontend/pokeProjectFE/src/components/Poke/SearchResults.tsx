// components/SearchResults.tsx
import { IonList, IonItem, IonLabel, IonImg } from '@ionic/react';
import { BasicPokemon } from '../../services/PokemonTypes';

interface SearchResultsProps {
  results: BasicPokemon[];
  query: string;
  isLoading: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({ 
  results, 
  query, 
  isLoading 
}) => {
  if (isLoading) return <div>Buscando...</div>;
  
  return (
    <IonList lines="full">
      {results.map(pokemon => (
        <IonItem 
          key={pokemon.id} 
          routerLink={`/details/${pokemon.name}`}
          detail
        >
          <IonImg 
            src={pokemon.sprite}
            slot="start"
            style={{ width: '50px', height: '50px' }}
            alt={`Sprite de ${pokemon.name}`}
          />
          <IonLabel>
            <h2>{pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h2>
            <p>ID: #{pokemon.id}</p>
          </IonLabel>
        </IonItem>
      ))}
      {results.length === 0 && query && !isLoading && (
        <IonItem>
          <IonLabel color="medium">
            {isNaN(Number(query))
              ? `No se encontraron Pokémon que coincidan con "${query}"`
              : `No existe Pokémon con el ID ${query}`}
          </IonLabel>
        </IonItem>
      )}
    </IonList>
  );
};

export default SearchResults;