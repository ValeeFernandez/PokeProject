
import { IonList, IonItem, IonLabel } from '@ionic/react';

interface PokemonAbilitiesProps {
  abilities: string[];
}

const PokemonAbilities: React.FC<PokemonAbilitiesProps> = ({ abilities }) => {
  return (
    <div className="ion-margin-top">
      <IonLabel>Habilidades:</IonLabel>
      <IonList>
        {abilities.map((ability) => (
          <IonItem key={ability}>
            <IonLabel>
              {ability.charAt(0).toUpperCase() + ability.slice(1).replace('-', ' ')}
            </IonLabel>
          </IonItem>
        ))}
      </IonList>
    </div>
  );
};

export default PokemonAbilities;