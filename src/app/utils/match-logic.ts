/**
 * Match Logic Utility
 * 
 * This utility calculates the compatibility percentage between two users based on 10 criteria.
 * 
 * SCALABILITY NOTE: 
 * For a large-scale application (10,000+ users), performing these calculations in-memory 
 * for every request will be slow (O(N) complexity). 
 * RECOMMENDATION: Move this to a background job (e.g., BullMQ + Redis) that pre-calculates 
 * scores and stores them in a 'Match' collection/table for instant retrieval.
 */

export interface MatchCriteria {
  religion?: string;
  age?: number;
  partnerAgeMin?: number;
  partnerAgeMax?: number;
  maritalStatus?: string;
  partnerMaritalStatus?: string[];
  division?: string;
  highestEducation?: string;
  partnerEducation?: string;
  sect?: string;
  employedIn?: string;
  citizenship?: string;
  eatingHabits?: string;
  motherTongue?: string;
}

export const calculateMatchScore = (userA: MatchCriteria, userB: MatchCriteria): number => {
  const calculateSideScore = (perf: MatchCriteria, data: MatchCriteria): number => {
    let score = 0;
    let criteriaCount = 0;

    const check = (prefVal: any, dataVal: any, isMatch: (p: any, d: any) => boolean) => {
      if (prefVal !== undefined && prefVal !== null && dataVal !== undefined && dataVal !== null) {
        criteriaCount++;
        if (isMatch(prefVal, dataVal)) {
          score += 10;
        }
      }
    };

    const normalize = (val: any) => String(val || '').trim().toLowerCase();

    // 1. Religion (Strictly Islam)
    check(perf.religion, data.religion, (p, d) => {
      const pNorm = normalize(p);
      const dNorm = normalize(d);
      return pNorm === 'islam' && dNorm === 'islam';
    });


    // 2. Age
    check({ min: perf.partnerAgeMin, max: perf.partnerAgeMax }, data.age, (p: any, d: number) => {
      const min = p.min || 18;
      const max = p.max || 70;
      return d >= min && d <= max;
    });

    // 3. Marital Status
    check(perf.partnerMaritalStatus, data.maritalStatus, (p: string[], d: string) => {
      if (!p || p.length === 0) return true;
      return p.some(val => normalize(val) === normalize(d));
    });

    // 4. Location (Division)
    check(perf.division, data.division, (p, d) => normalize(p) === normalize(d));

    // 5. Education
    check(perf.partnerEducation, data.highestEducation, (p, d) => normalize(p) === normalize(d));

    // 6. Sect
    check(perf.sect, data.sect, (p, d) => normalize(p) === normalize(d));

    // 7. Employment Type
    check(perf.employedIn, data.employedIn, (p, d) => normalize(p) === normalize(d));

    // 8. Citizenship
    check(perf.citizenship, data.citizenship, (p, d) => normalize(p) === normalize(d));

    // 9. Eating Habits
    check(perf.eatingHabits, data.eatingHabits, (p, d) => normalize(p) === normalize(d));

    // 10. Mother Tongue
    check(perf.motherTongue, data.motherTongue, (p, d) => normalize(p) === normalize(d));


    if (criteriaCount === 0) return 100; // If no criteria can be compared, we don't penalize
    return (score / (criteriaCount * 10)) * 100;
  };

  const scoreAagainstB = calculateSideScore(userA, userB);
  const scoreBagainstA = calculateSideScore(userB, userA);

  return Math.round((scoreAagainstB + scoreBagainstA) / 2);
};
