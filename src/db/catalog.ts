/**
 * Den globala övningskatalogen, bakad in i bygget.
 *
 * VARFÖR ID:NA ÄR HÅRDKODADE: det här är exakt de rader som ligger i Supabase
 * (`exercises` med `owner_id is null`), hämtade därifrån. Skulle klienten seeda
 * med egna id:n skulle synken i fas 7 se dem som nya rader och skapa 45
 * dubbletter — en tyst datakorruption som ingen upptäcker förrän katalogen är
 * full av dubbelposter.
 *
 * Katalogen ligger i bygget och inte bakom ett nätanrop eftersom appen måste
 * fungera vid första start i en gymkällare.
 *
 * Verifieras av `catalog.test.ts` mot en kontrollsumma tagen ur databasen.
 * Ändras katalogen i en framtida migration ska den checksumman uppdateras i
 * samma commit — annars är repot och databasen inte längre överens.
 */

export interface CatalogExercise {
  id: string;
  name: string;
  aliases: string[];
  primaryMuscle: string;
  equipment: string;
}

export const CATALOG_ID_CHECKSUM = '4e361bd25fa3726585b88318df886e26';
export const CATALOG_NAME_CHECKSUM = '503593620b48c5cdc5dc40bfd78dcc03';

export const CATALOG: CatalogExercise[] = [
  // Axlar
  { id: '06c0faa3-c4cb-4f30-9817-1f4e7b6b3fa6', name: 'Axelpress med hantlar', aliases: ['axelpress', 'shoulder press', 'dumbbell shoulder press'], primaryMuscle: 'axlar', equipment: 'hantlar' },
  { id: '5558be19-5ad5-4818-a100-1679454e8657', name: 'Face pull', aliases: ['face pull', 'facepull', 'ansiktsdrag'], primaryMuscle: 'axlar', equipment: 'kabel' },
  { id: 'bd31ecf4-04c2-40ec-909c-048406e6b655', name: 'Framåtlyft', aliases: ['framåtlyft', 'front raise'], primaryMuscle: 'axlar', equipment: 'hantlar' },
  { id: '31db171e-d747-46ce-8bf7-4a1a2473a255', name: 'Militärpress', aliases: ['militärpress', 'ohp', 'overhead press', 'stångpress'], primaryMuscle: 'axlar', equipment: 'skivstång' },
  { id: '0db13d7e-7fb4-47a3-a1e6-17baa470ca35', name: 'Omvänd flyes', aliases: ['omvänd flyes', 'reverse fly', 'rear delt fly', 'bakre axlar'], primaryMuscle: 'axlar', equipment: 'hantlar' },
  { id: '71af2635-6208-4da3-abf9-4bf02c926c80', name: 'Sidolyft', aliases: ['sidolyft', 'lateral raise', 'laterals', 'side raise'], primaryMuscle: 'axlar', equipment: 'hantlar' },

  // Baksida lår
  { id: 'da27b8d2-ccdf-4df2-b41f-240a5a375c2d', name: 'Goodmorning', aliases: ['goodmorning', 'good morning'], primaryMuscle: 'baksida lår', equipment: 'skivstång' },
  { id: '5ffdc4a4-8b68-4c91-bcd1-7945efeabca8', name: 'Lårcurl', aliases: ['lårcurl', 'leg curl', 'hamstringcurl', 'liggande lårcurl'], primaryMuscle: 'baksida lår', equipment: 'maskin' },
  { id: 'fb6ac619-724d-4f8d-bce1-79e23eb7f96a', name: 'Rumänsk marklyft', aliases: ['rumänska', 'rdl', 'romanian deadlift', 'raka marklyft'], primaryMuscle: 'baksida lår', equipment: 'skivstång' },

  // Biceps
  { id: '5f3ddb52-20b1-4e6c-aa75-3a48ca61ecb2', name: 'Bicepscurl', aliases: ['curl', 'bicepscurl', 'stångcurl', 'barbell curl'], primaryMuscle: 'biceps', equipment: 'skivstång' },
  { id: '17f1e429-9ad8-445f-a6c1-6079b2ccf0d9', name: 'Hammercurl', aliases: ['hammer', 'hammercurl', 'hammer curl'], primaryMuscle: 'biceps', equipment: 'hantlar' },
  { id: '008f92e9-4d64-45de-beef-9b42e3f12f69', name: 'Hantelcurl', aliases: ['hantelcurl', 'dumbbell curl', 'db curl'], primaryMuscle: 'biceps', equipment: 'hantlar' },
  { id: '5e3a4d9b-52b3-4160-9e66-de35f3209411', name: 'Överhandscurl', aliases: ['överhandscurl', 'reverse curl'], primaryMuscle: 'biceps', equipment: 'skivstång' },
  { id: '467e05a5-cc28-430d-8831-dcfdacf34024', name: 'Scottcurl', aliases: ['scottcurl', 'preacher curl', 'preacher'], primaryMuscle: 'biceps', equipment: 'skivstång' },

  // Bröst
  { id: '38433903-c5f6-41e4-b2e8-4f0587b6d0cf', name: 'Bänkpress', aliases: ['bänk', 'bänkpress', 'bench', 'bench press', 'bp'], primaryMuscle: 'bröst', equipment: 'skivstång' },
  { id: '04285c82-f2f1-4681-b33e-36bdf18e32ca', name: 'Dips', aliases: ['dips', 'dip', 'bröstdips'], primaryMuscle: 'bröst', equipment: 'kroppsvikt' },
  { id: '14eea16c-140d-49d8-967a-a51a2dd80fb8', name: 'Hantelflyes', aliases: ['flyes', 'fly', 'hantelflyes', 'dumbbell fly'], primaryMuscle: 'bröst', equipment: 'hantlar' },
  { id: '48fc0175-34d1-4999-b803-99ee8ff6a118', name: 'Hantelpress', aliases: ['hantelpress', 'hantelbänk', 'dumbbell press', 'db press'], primaryMuscle: 'bröst', equipment: 'hantlar' },
  { id: '00eb93ff-fab4-4f10-8807-d2c37871a3bc', name: 'Kabelcross', aliases: ['kabelcross', 'crossover', 'cable crossover', 'kabelflyes'], primaryMuscle: 'bröst', equipment: 'kabel' },
  { id: '63deb238-6d64-427c-98f9-31b6e901a58d', name: 'Lutande bänkpress', aliases: ['lutande bänk', 'snedbänk', 'incline', 'incline bench'], primaryMuscle: 'bröst', equipment: 'skivstång' },

  // Framsida lår
  { id: 'e5669408-c512-4988-ac52-d75d0dc34d07', name: 'Benpress', aliases: ['benpress', 'leg press', 'lp'], primaryMuscle: 'framsida lår', equipment: 'maskin' },
  { id: 'd9e25a7b-ff5c-4bdf-9625-62952791c618', name: 'Benspark', aliases: ['benspark', 'leg extension', 'extension'], primaryMuscle: 'framsida lår', equipment: 'maskin' },
  { id: '75b19015-c61f-4d41-a6b7-9a1ea153f91d', name: 'Bulgarsk split squat', aliases: ['bulgarska', 'bulgarian split squat', 'split squat'], primaryMuscle: 'framsida lår', equipment: 'hantlar' },
  { id: '354abe96-7244-472f-a8c6-db42d292d8a5', name: 'Frontböj', aliases: ['frontböj', 'framböj', 'front squat'], primaryMuscle: 'framsida lår', equipment: 'skivstång' },
  { id: 'da36f46c-a6e7-4eea-babe-7775e348c9f6', name: 'Hacklyft', aliases: ['hacklyft', 'hack squat'], primaryMuscle: 'framsida lår', equipment: 'maskin' },
  { id: '1c9ac04d-9226-42d1-a47e-ca9b27530e0b', name: 'Knäböj', aliases: ['böj', 'knäböj', 'benböj', 'squat', 'back squat'], primaryMuscle: 'framsida lår', equipment: 'skivstång' },
  { id: '3e3e0490-db9f-4bad-8d4b-508482370c59', name: 'Utfall', aliases: ['utfall', 'lunges', 'lunge'], primaryMuscle: 'framsida lår', equipment: 'hantlar' },

  // Mage
  { id: '2046dbc7-4f0e-40ef-813a-11f89d7726e4', name: 'Hängande benlyft', aliases: ['benlyft', 'hängande benlyft', 'hanging leg raise'], primaryMuscle: 'mage', equipment: 'kroppsvikt' },
  { id: '76a0d9e6-3f6a-4ccb-b0e6-f748cda03640', name: 'Kabelcrunch', aliases: ['kabelcrunch', 'cable crunch'], primaryMuscle: 'mage', equipment: 'kabel' },
  { id: 'e3be8bf1-f54a-4575-8421-1d906725b6ee', name: 'Plankan', aliases: ['planka', 'plankan', 'plank'], primaryMuscle: 'mage', equipment: 'kroppsvikt' },
  { id: 'bd91ca81-ba1a-42ae-88c5-a6ea4549162c', name: 'Situps', aliases: ['situps', 'sit-up', 'magböj', 'crunches'], primaryMuscle: 'mage', equipment: 'kroppsvikt' },

  // Rygg
  { id: '9f99d443-53a1-47dd-9509-5bf46fa1322b', name: 'Chins', aliases: ['chins', 'chin', 'pullup', 'pull-up', 'pullups', 'räck'], primaryMuscle: 'rygg', equipment: 'kroppsvikt' },
  { id: 'b22ff89e-591c-44ca-9c3c-341c7fd9ff72', name: 'Hantelrodd', aliases: ['hantelrodd', 'enarmsrodd', 'dumbbell row', 'db row'], primaryMuscle: 'rygg', equipment: 'hantlar' },
  { id: 'af61f570-da5c-4a00-bb69-6004b7ad3553', name: 'Latsdrag', aliases: ['lats', 'latsdrag', 'lat pulldown', 'pulldown'], primaryMuscle: 'rygg', equipment: 'kabel' },
  { id: 'b0afdf85-e0e7-4adc-a1a7-1f8c747e7d95', name: 'Marklyft', aliases: ['mark', 'marklyft', 'deadlift', 'dl'], primaryMuscle: 'rygg', equipment: 'skivstång' },
  { id: '2104e7cb-4463-4a77-b952-08cc87ac54f4', name: 'Pullover', aliases: ['pullover', 'dumbbell pullover'], primaryMuscle: 'rygg', equipment: 'hantlar' },
  { id: '119b987b-4d0d-4ccc-9528-453f49ed4b17', name: 'Shrugs', aliases: ['shrugs', 'shrug', 'axelryckningar'], primaryMuscle: 'rygg', equipment: 'hantlar' },
  { id: '6721bfd1-f48e-4e48-bf53-b6011eaa879d', name: 'Sittande kabelrodd', aliases: ['kabelrodd', 'sittande rodd', 'seated row', 'cable row'], primaryMuscle: 'rygg', equipment: 'kabel' },
  { id: '039083d7-6997-430c-97c9-9c87a4300a10', name: 'Skivstångsrodd', aliases: ['rodd', 'stångrodd', 'barbell row', 'bent over row'], primaryMuscle: 'rygg', equipment: 'skivstång' },
  { id: 'a4fd8206-4643-472f-ae80-e78fc1a4cd05', name: 'T-bar rodd', aliases: ['tbar', 't-bar', 't-bar row', 'tbar rodd'], primaryMuscle: 'rygg', equipment: 'skivstång' },

  // Säte
  { id: 'bb84a461-634f-48a8-b809-e1c210bc38f5', name: 'Höftlyft', aliases: ['höftlyft', 'hip thrust', 'thrust'], primaryMuscle: 'säte', equipment: 'skivstång' },

  // Triceps
  { id: '1ea86efb-851e-418a-98f0-3c3c592a8e6f', name: 'Fransk press', aliases: ['fransk press', 'skullcrusher', 'skull crusher'], primaryMuscle: 'triceps', equipment: 'skivstång' },
  { id: '1ab531d9-c81a-4681-8394-e07f9ba337e8', name: 'Tricepsdips', aliases: ['tricepsdips', 'bench dip', 'bänkdips'], primaryMuscle: 'triceps', equipment: 'kroppsvikt' },
  { id: 'f44f4427-2345-45be-bcf6-f6b7121780fc', name: 'Tricepspress', aliases: ['tricepspress', 'pushdown', 'triceps pushdown', 'tricepsrep'], primaryMuscle: 'triceps', equipment: 'kabel' },

  // Vader
  { id: 'c6a9e796-10c7-41bb-8c5b-7f6ccf03c421', name: 'Vadpress', aliases: ['vader', 'vadpress', 'calf raise', 'tåhävningar'], primaryMuscle: 'vader', equipment: 'maskin' },
];
