// src/components/pokemon/PokemonStats.tsx
import { IonList, IonItem, IonLabel, IonProgressBar } from '@ionic/react';

interface PokemonStatsProps {
  height: number;
  weight: number;
  stats: {
    name: string;
    base: number;
  }[];
}

const PokemonStats: React.FC<PokemonStatsProps> = ({ height, weight, stats }) => {
  const formatStatName = (name: string) => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <IonList>
      <IonItem>
        <IonLabel>Altura: {(height / 10).toFixed(1)} m</IonLabel>
      </IonItem>
      <IonItem>
        <IonLabel>Peso: {(weight / 10).toFixed(1)} kg</IonLabel>
      </IonItem>

      {stats.map((stat, index) => (
        <IonItem key={index}>
          <IonLabel className="ion-text-wrap">
            <strong>{formatStatName(stat.name)}:</strong> {stat.base}
            <IonProgressBar 
              value={Math.min(stat.base / 150, 1)} 
              color="primary" 
              style={{ marginTop: '4px', height: '8px' }}
            />
          </IonLabel>
        </IonItem>
      ))}
    </IonList>
  );
};

export default PokemonStats;
