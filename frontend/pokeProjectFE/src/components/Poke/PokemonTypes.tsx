// src/components/pokemon/PokemonTypes.tsx
import { IonChip, IonLabel } from '@ionic/react';

interface PokemonTypesProps {
  types: string[];
}

const PokemonTypes: React.FC<PokemonTypesProps> = ({ types }) => {
  return (
    <div className="ion-margin-top">
      <IonLabel>Tipo:</IonLabel>
      <div className="ion-margin-top">
        {types.map((type) => (
          <IonChip 
            key={type}
            style={{ 
              backgroundColor: `var(--ion-color-${type})`,
              color: 'black'
            }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </IonChip>
        ))}
      </div>
    </div>
  );
};

export default PokemonTypes;