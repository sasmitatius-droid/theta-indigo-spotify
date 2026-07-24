export interface KuaResult {
  kuaNumber: number; // 1-9
  group: 'Kelompok Timur (East Group)' | 'Kelompok Barat (West Group)';
  bestSleepingDirection: string;
  bestWorkingDirection: string;
  bestStudyingDirection: string;
  bestRelationshipDirection: string;
  avoidDirections: string;
  summary: string;
}

/**
 * Menghitung Kua Number & Feng Shui Ba Zhai
 */
export function calculateKua(birthDate: Date, gender: string = 'male'): KuaResult {
  const year = birthDate.getFullYear();
  const lastTwoDigits = year % 100;
  
  let kuaNumber = 1;

  if (gender === 'female') {
    if (year < 2000) {
      kuaNumber = (lastTwoDigits + 4) % 9;
      if (kuaNumber === 0) kuaNumber = 9;
      if (kuaNumber === 5) kuaNumber = 8; // Female 5 -> 8
    } else {
      kuaNumber = (lastTwoDigits + 6) % 9;
      if (kuaNumber === 0) kuaNumber = 9;
      if (kuaNumber === 5) kuaNumber = 8;
    }
  } else {
    // Default male
    if (year < 2000) {
      kuaNumber = (100 - lastTwoDigits) % 9;
      if (kuaNumber === 0) kuaNumber = 9;
      if (kuaNumber === 5) kuaNumber = 2; // Male 5 -> 2
    } else {
      kuaNumber = (99 - lastTwoDigits) % 9;
      if (kuaNumber === 0) kuaNumber = 9;
      if (kuaNumber === 5) kuaNumber = 2;
    }
  }

  const isEastGroup = [1, 3, 4, 9].includes(kuaNumber);
  const group = isEastGroup ? 'Kelompok Timur (East Group)' : 'Kelompok Barat (West Group)';

  const directionMap: Record<number, { sleep: string; work: string; study: string; rel: string; avoid: string }> = {
    1: { sleep: 'Utara (Sheng Qi)', work: 'Tenggara (Tian Yi)', study: 'Timur (Fu Wei)', rel: 'Selatan (Yan Nian)', avoid: 'Barat Daya, Barat Laut, Barat, Barat Daya' },
    2: { sleep: 'Barat Daya (Sheng Qi)', work: 'Barat (Tian Yi)', study: 'Barat Laut (Fu Wei)', rel: 'Timur Laut (Yan Nian)', avoid: 'Utara, Tenggara, Timur, Selatan' },
    3: { sleep: 'Timur (Sheng Qi)', work: 'Selatan (Tian Yi)', study: 'Utara (Fu Wei)', rel: 'Tenggara (Yan Nian)', avoid: 'Barat Laut, Barat Daya, Barat, Timur Laut' },
    4: { sleep: 'Tenggara (Sheng Qi)', work: 'Utara (Tian Yi)', study: 'Selatan (Fu Wei)', rel: 'Timur (Yan Nian)', avoid: 'Barat, Timur Laut, Barat Daya, Barat Laut' },
    6: { sleep: 'Barat Laut (Sheng Qi)', work: 'Barat Daya (Tian Yi)', study: 'Barat (Fu Wei)', rel: 'Timur Laut (Yan Nian)', avoid: 'Selatan, Utara, Timur, Tenggara' },
    7: { sleep: 'Barat (Sheng Qi)', work: 'Barat Laut (Tian Yi)', study: 'Barat Daya (Fu Wei)', rel: 'Timur Laut (Yan Nian)', avoid: 'Tenggara, Timur, Selatan, Utara' },
    8: { sleep: 'Timur Laut (Sheng Qi)', work: 'Barat (Tian Yi)', study: 'Barat Daya (Fu Wei)', rel: 'Barat Laut (Yan Nian)', avoid: 'Utara, Selatan, Tenggara, Timur' },
    9: { sleep: 'Selatan (Sheng Qi)', work: 'Timur (Tian Yi)', study: 'Tenggara (Fu Wei)', rel: 'Utara (Yan Nian)', avoid: 'Barat Daya, Barat Laut, Barat, Timur Laut' },
  };

  const dirs = directionMap[kuaNumber] || directionMap[1];

  return {
    kuaNumber,
    group,
    bestSleepingDirection: dirs.sleep,
    bestWorkingDirection: dirs.work,
    bestStudyingDirection: dirs.study,
    bestRelationshipDirection: dirs.rel,
    avoidDirections: dirs.avoid,
    summary: `Angka Kua ${kuaNumber} menempatkan Anda dalam ${group}. Mengarahkan meja kerja dan posisi tidur ke arah hoki Anda akan mengoptimalkan aliran aliran rezeki dan energi pemulihan fisik.`,
  };
}
