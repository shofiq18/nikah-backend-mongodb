export const calculateMatchScore = (userA, userB) => {
    const calculateSideScore = (perf, data) => {
        let score = 0;
        let criteriaCount = 0;
        const check = (prefVal, dataVal, isMatch) => {
            if (prefVal !== undefined && prefVal !== null && dataVal !== undefined && dataVal !== null) {
                criteriaCount++;
                if (isMatch(prefVal, dataVal)) {
                    score += 10;
                }
            }
        };
        const normalize = (val) => String(val || '').trim().toLowerCase();
        check(perf.religion, data.religion, (p, d) => {
            const pNorm = normalize(p);
            const dNorm = normalize(d);
            return pNorm === 'islam' && dNorm === 'islam';
        });
        check({ min: perf.partnerAgeMin, max: perf.partnerAgeMax }, data.age, (p, d) => {
            const min = p.min || 18;
            const max = p.max || 70;
            return d >= min && d <= max;
        });
        check(perf.partnerMaritalStatus, data.maritalStatus, (p, d) => {
            if (!p || p.length === 0)
                return true;
            return p.some(val => normalize(val) === normalize(d));
        });
        check(perf.division, data.division, (p, d) => normalize(p) === normalize(d));
        check(perf.partnerEducation, data.highestEducation, (p, d) => normalize(p) === normalize(d));
        check(perf.sect, data.sect, (p, d) => normalize(p) === normalize(d));
        check(perf.employedIn, data.employedIn, (p, d) => normalize(p) === normalize(d));
        check(perf.citizenship, data.citizenship, (p, d) => normalize(p) === normalize(d));
        check(perf.eatingHabits, data.eatingHabits, (p, d) => normalize(p) === normalize(d));
        check(perf.motherTongue, data.motherTongue, (p, d) => normalize(p) === normalize(d));
        if (criteriaCount === 0)
            return 100;
        return (score / (criteriaCount * 10)) * 100;
    };
    const scoreAagainstB = calculateSideScore(userA, userB);
    const scoreBagainstA = calculateSideScore(userB, userA);
    return Math.round((scoreAagainstB + scoreBagainstA) / 2);
};
//# sourceMappingURL=match-logic.js.map