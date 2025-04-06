// src/components/PokemonComparison.tsx
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol } from '@ionic/react';

interface StatComparison {
  name: string;
  value1: number;
  value2: number;
}

interface PokemonComparisonProps {
  pokemon1: any;
  pokemon2: any;
}

const PokemonComparison: React.FC<PokemonComparisonProps> = ({ pokemon1, pokemon2 }) => {
  const statsToCompare: StatComparison[] = [
    { name: 'HP', value1: pokemon1.stats[0].base_stat, value2: pokemon2.stats[0].base_stat },
    { name: 'Ataque', value1: pokemon1.stats[1].base_stat, value2: pokemon2.stats[1].base_stat },
    { name: 'Defensa', value1: pokemon1.stats[2].base_stat, value2: pokemon2.stats[2].base_stat },
    { name: 'Ataque Especial', value1: pokemon1.stats[3].base_stat, value2: pokemon2.stats[3].base_stat },
    { name: 'Defensa Especial', value1: pokemon1.stats[4].base_stat, value2: pokemon2.stats[4].base_stat },
    { name: 'Velocidad', value1: pokemon1.stats[5].base_stat, value2: pokemon2.stats[5].base_stat },
  ];

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle className="ion-text-center">
          Comparación: {pokemon1.name} vs {pokemon2.name}
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonGrid>
          <IonRow>
            <IonCol><strong>Estadística</strong></IonCol>
            <IonCol><strong>{pokemon1.name}</strong></IonCol>
            <IonCol><strong>{pokemon2.name}</strong></IonCol>
          </IonRow>
          
          {statsToCompare.map((stat, index) => (
            <IonRow key={index}>
              <IonCol>{stat.name}</IonCol>
              <IonCol>{stat.value1}</IonCol>
              <IonCol>{stat.value2}</IonCol>
            </IonRow>
          ))}
        </IonGrid>
      </IonCardContent>
    </IonCard>
  );
};

export default PokemonComparison;