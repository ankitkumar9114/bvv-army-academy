export type TrainerId = 'rajesh' | 'vikram' | 'sunita' | 'amit' | 'neha' | 'priya';

export interface Trainer {
  id: TrainerId;
  experienceYears: number;
  /** Ex-armed-forces or ex-police trainer. */
  exService: boolean;
  /** Real photo, once provided. */
  src?: string;
}

// Names, specialties and bios live in the locale files under trainers.items.<id>. All mock.
export const trainers: Trainer[] = [
  { id: 'rajesh', experienceYears: 22, exService: true },
  { id: 'vikram', experienceYears: 18, exService: true },
  { id: 'sunita', experienceYears: 12, exService: false },
  { id: 'amit', experienceYears: 10, exService: false },
  { id: 'neha', experienceYears: 9, exService: false },
  { id: 'priya', experienceYears: 11, exService: false },
];
