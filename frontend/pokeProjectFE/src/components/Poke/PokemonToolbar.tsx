// components/PokemonToolbar.tsx
import { 
    IonToolbar, IonTitle, IonButtons, IonButton 
  } from '@ionic/react';
  
  interface PokemonToolbarProps {
    showCompare: boolean;
    setShowCompare: (show: boolean) => void;
    pokemonCount: number;
    isSearching: boolean;
  }
  
  const PokemonToolbar: React.FC<PokemonToolbarProps> = ({ 
    showCompare, 
    setShowCompare, 
    pokemonCount, 
    isSearching 
  }) => {
    return (
      <IonToolbar>
        <IonTitle>Pokédex</IonTitle>
        <IonButtons slot="end">
          <IonButton 
            onClick={() => setShowCompare(true)} 
            disabled={pokemonCount < 2 || isSearching}
            data-testid="compare-button"
          >
            Comparar
          </IonButton>
        </IonButtons>
      </IonToolbar>
    );
  };
  
  export default PokemonToolbar;