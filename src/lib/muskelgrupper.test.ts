import { describe, expect, it } from 'vitest';
import { muskelrad } from './muskelgrupper';

/**
 * Vakt över passkortets andra rad. Uppgift steg 4.3 del A.
 *
 * ⚠️ **Formen är Adams val 2026-08-28, siffrorna i den är mina.** Taket på tre
 * namngivna grupper är valt och inte uppmätt — se konstanten i `muskelgrupper.ts`.
 * Ändras taket ska raden `namnger tre grupper …` nedan falla först, inte en
 * användare som ser en kapad rad på telefonen.
 */
describe('steg 4.3 muskelgruppsraden', () => {
  it('namnger en ensam grupp utan skiljetecken', () => {
    expect(muskelrad([{ muscle: 'bröst', setCount: 4 }])).toBe('Bröst');
  });

  it('binder ihop två grupper med "och"', () => {
    expect(
      muskelrad([
        { muscle: 'bröst', setCount: 4 },
        { muscle: 'triceps', setCount: 3 },
      ])
    ).toBe('Bröst och triceps');
  });

  it('namnger tre grupper med komma och ett avslutande "och"', () => {
    expect(
      muskelrad([
        { muscle: 'bröst', setCount: 5 },
        { muscle: 'triceps', setCount: 4 },
        { muscle: 'axlar', setCount: 3 },
      ])
    ).toBe('Bröst, triceps och axlar');
  });

  it('räknar resten i stället för att rada upp allt när grupperna är fler än taket', () => {
    // Ett helkroppspass är inte påhittat, och raden får inte bli en uppräkning
    // av halva katalogen. `och 2 till` säger att det fanns mer utan att kosta
    // bredd — samma avvägning som gjorde att övningsnamnen valdes bort.
    expect(
      muskelrad([
        { muscle: 'bröst', setCount: 5 },
        { muscle: 'triceps', setCount: 4 },
        { muscle: 'axlar', setCount: 3 },
        { muscle: 'rygg', setCount: 2 },
        { muscle: 'mage', setCount: 1 },
      ])
    ).toBe('Bröst, triceps, axlar och 2 till');
  });

  it('väger grupper mot varandra, inte enskilda övningar', () => {
    // ⛔ DET HÄR ÄR RADENS TYNGSTA REGEL. Två bröstövningar med 3 + 2 set väger
    // tyngre än en ryggövning med 4, och raden ska säga vad passet MEST var.
    // Sorteras övningarna i stället för grupperna hamnar rygg först — och det
    // faller tyst: raden är läsbar, välformad och osann.
    expect(
      muskelrad([
        { muscle: 'rygg', setCount: 4 },
        { muscle: 'bröst', setCount: 3 },
        { muscle: 'bröst', setCount: 2 },
      ])
    ).toBe('Bröst och rygg');
  });

  it('låter den som kom först i passet stå först när grupperna är lika stora', () => {
    // Oavgjort avgörs av insättningsordningen, vilket bygger på att `sort` är
    // stabil. Det är garanterat sedan ES2019 men lätt att råka bygga bort med
    // en egen jämförelse, och då blir ordningen godtycklig mellan körningar.
    expect(
      muskelrad([
        { muscle: 'rygg', setCount: 3 },
        { muscle: 'biceps', setCount: 3 },
      ])
    ).toBe('Rygg och biceps');
  });

  it('svarar null för ett pass utan arbetsset, så raden kan utebli helt', () => {
    // Inte en tom sträng: raden ska inte ritas alls. Ett pass man bara värmde
    // upp på är verkligt — starta pass, värm upp, gå hem — och §3.3:s regel är
    // att en nolla ser ut som ett resultat.
    expect(muskelrad([])).toBeNull();
  });

  it('versaliserar bara radens första bokstav', () => {
    // `Baksida Lår` hade sett ut som ett egennamn. Katalogen skriver alla
    // grupper gement, och gruppen är ett begrepp — inte två ord.
    expect(muskelrad([{ muscle: 'baksida lår', setCount: 3 }])).toBe('Baksida lår');
  });

  it('säger "Övrigt" om egna övningar i stället för att lämna raden tom', () => {
    // `createExercise` sätter `primaryMuscle: 'övrigt'` (`repo.ts`). Ett pass med
    // bara egna övningar ska alltså säga något — inte försvinna.
    expect(muskelrad([{ muscle: 'övrigt', setCount: 2 }])).toBe('Övrigt');
  });
});
