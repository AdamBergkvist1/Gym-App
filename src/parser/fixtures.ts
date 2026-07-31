/**
 * Testkatalog. Ett litet urval ur den riktiga övningskatalogen i
 * 0001_initial_schema.sql, med samma alias — så att testerna mäter samma
 * matchning som produktionen kommer att göra.
 *
 * Ligger i en egen fil (inte en .test.ts) eftersom både matchExercise- och
 * parse-testerna använder den.
 */
import type { ExerciseRef } from './types';

function ref(id: string, name: string, aliases: string[]): ExerciseRef {
  return { id, name, normalizedName: name.toLowerCase().trim(), aliases };
}

export const TEST_EXERCISES: ExerciseRef[] = [
  ref('11111111-1111-4111-8111-111111111111', 'Bänkpress', [
    'bänk',
    'bänkpress',
    'bench',
    'bench press',
    'bp',
  ]),
  ref('22222222-2222-4222-8222-222222222222', 'Knäböj', [
    'böj',
    'knäböj',
    'benböj',
    'squat',
    'back squat',
  ]),
  ref('33333333-3333-4333-8333-333333333333', 'Marklyft', [
    'mark',
    'marklyft',
    'deadlift',
    'dl',
  ]),
  ref('44444444-4444-4444-8444-444444444444', 'Sidolyft', [
    'sidolyft',
    'lateral raise',
    'laterals',
  ]),
  // Två övningar vars namn börjar likadant — fångar att prefixmatchning
  // inte får gissa när två kandidater är lika bra.
  ref('55555555-5555-4555-8555-555555555555', 'Hantelcurl', ['hantelcurl', 'dumbbell curl']),
  ref('66666666-6666-4666-8666-666666666666', 'Hantelpress', ['hantelpress', 'dumbbell press']),
];

export const BENKPRESS_ID = '11111111-1111-4111-8111-111111111111';
