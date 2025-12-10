# Circadian Science Research Summary

## Research Sources

1. [Interventions to Minimize Jet Lag After Westward and Eastward Flight - Frontiers](https://www.frontiersin.org/articles/10.3389/fphys.2019.00927/full)
2. [Advancing Circadian Rhythms Before Eastward Flight - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC1249488/)
3. [Preflight Adjustment: 3 Days with Morning Bright Light - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC1262683/)
4. [Human Circadian Phase-Response Curves for Exercise - Youngstedt 2019](https://physoc.onlinelibrary.wiley.com/doi/full/10.1113/JP276943)
5. [Circadian Rhythm Phase Shifts from Exercise Vary by Chronotype - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7098792/)
6. [Single Dose Creatine and Cognitive Performance - Nature 2024](https://www.nature.com/articles/s41598-024-54249-9)

---

## 1. Eastward Travel Direction Logic - VERIFIED

### The Problem
- San Francisco (UTC-8) → Vienna (UTC+1) = **+9 hours eastward**
- Traveling **EAST** requires **PHASE ADVANCE** (shifting earlier)
- Human circadian period is ~24.2h (>24h), making advances HARDER than delays

### The Science
From research: "Light exposure in the ~12h **after CBTmin** shifts the circadian system **forward/earlier** (phase ADVANCE)"

For someone sleeping 23:00-07:00:
- **DLMO** (melatonin onset): ~21:00 (2h before bed)
- **CBTmin** (core body temp minimum): ~04:00 (7h after DLMO)
- **CBTmax**: ~16:00

### Eastward Strategy (Phase Advance)
| Intervention | Timing | Why |
|-------------|--------|-----|
| **Morning light** | 2-4h after CBTmin (06:00-10:00) | Largest advance zone |
| **Avoid evening light** | After 17:00 | Prevents delays |
| **Melatonin** | ~5h before bedtime (~18:00) | Advances clock |
| **Morning exercise** | 07:00-09:00 | Reinforces advance |
| **Early breakfast** | Within 1h of waking | Anchors peripheral clocks |

### CRITICAL: Antidromic Re-entrainment Risk
Research shows that in one study flying 11 TZ east, **7 of 8 subjects re-entrained by DELAYING instead of advancing** because light hit them at the wrong time. This happens when you get light exposure BEFORE CBTmin (during the delay zone).

**For SFO→Vienna (9h east):**
- Arriving in Vienna morning, the traveler's CBTmin is still at ~04:00 SF time = ~13:00 Vienna time
- Morning light in Vienna (07:00-09:00 local) hits BEFORE their CBTmin
- This could cause a **DELAY** instead of advance!

**Solution:** For very large eastward shifts (>8h), consider whether to:
1. Pre-shift aggressively before departure
2. Or accept initial delay strategy (go "the long way around")

---

## 2. Pre-Departure Protocol - Evidence-Based

### Research Finding
"A 1h/day advance of the sleep schedule combined with intermittent bright light (~5000 lux) for the first 3.5h after waking and melatonin in the afternoon phase advances the circadian clock by about **1h/day**."

### Practical Pre-Departure Schedule (3 days)

**Day -3:**
- Wake 30min earlier
- Morning light 07:00-09:00
- Melatonin at 17:30 (5h before bed)
- Bed 30min earlier (22:30)

**Day -2:**
- Wake 1h earlier (06:30)
- Morning light after waking
- Melatonin at 17:00
- Bed 1h earlier (22:00)

**Day -1:**
- Wake 1.5h earlier (06:00)
- Morning light after waking
- Melatonin at 16:30
- Bed 1.5h earlier (21:30)

**Achieved shift: ~1.5-2h advance** (matches ~30-45 min/day research finding)

### Why NOT 7 Days?
- Research used 3 days with good results
- Longer protocols reduce compliance
- Diminishing returns after initial days
- **User feedback: 6 days is too much**

---

## 3. Melatonin Protocol - VERIFIED

### Phase Response Curve for Melatonin
- **Max advance:** Take ~10.5h before CBTmin = ~5.5h before bedtime
- **Max delay:** Take ~6.5h after CBTmin = ~3.5h after wake

### Eastward (Advance) Protocol
For habitual 23:00 bedtime:
- Take **0.5-3mg melatonin at 17:30-18:00**
- This is ~5h before bed
- Research: "Light and melatonin effects are **additive** for phase advances"

### Dosage Note
Research: "Low doses (0.5mg) are often as effective as higher doses" for phase-shifting purposes.

### Current Code Issue
The code has melatonin at 4.5h before bed which is close but could be optimized to 5-5.5h for maximum advance effect.

---

## 4. Exercise Phase Response Curve

### Key Research (Youngstedt 2019)
"Significant phase–response curves were established... with large phase **delays** from 7:00pm to 10:00pm and large phase **advances** at both 7:00am AND from 1:00pm to 4:00pm."

### Exercise PRC Summary
| Time | Effect |
|------|--------|
| 07:00 AM | Phase ADVANCE (+0.6h) |
| 01:00-04:00 PM | Phase ADVANCE |
| 07:00-10:00 PM | Phase DELAY |
| Night | Minimal effect |

### Chronotype-Specific Effects

**Morning chronotypes:**
- Morning exercise → Advance (+0.49h)
- Evening exercise → **DELAY** (-0.41h) - BAD if trying to advance!

**Evening chronotypes (night owls):**
- Morning exercise → Advance (+0.54h)
- Evening exercise → ALSO advance (+0.46h)

### Recommendation for Eastward Travel
- **Morning exercise for ALL chronotypes** (07:00-09:00)
- Avoid evening exercise for early chronotypes
- Late chronotypes can exercise evening but morning is still better for advancing

### Exercise Type
Research gap: "Only cardiovascular exercise has been used in previous studies" for phase-shifting.
- Strength training effects unknown
- Recommend: **Moderate cardio** for circadian effects
- HR zone: 60-75% max (moderate intensity)

---

## 5. Creatine - NEW INTERVENTION

### Research Finding (2024)
"A single high dose of creatine can temporarily enhance cognitive performance during sleep deprivation... showing improved processing capacity and short-term memory."

- Effects peak at **4 hours** after ingestion
- Last up to **9 hours**
- Dose: ~0.35g/kg (about **25-30g** for average adult) for acute effect
- Or **5g daily** for ongoing support

### Mechanism
- Supports brain energy metabolism via phosphocreatine stores
- Influences adenosine signaling (sleep-wake regulator)
- May help body adapt to new time zones at molecular level

### Protocol for Jet Lag
- **Take 5-10g in the morning** after arrival
- Promotes wakefulness and mental sharpness
- Especially useful for arrival day when sleep-deprived

### Caution
- Requires adequate hydration
- Don't exceed 30g acute dose

---

## 6. Caffeine Protocol - User Feedback

### User Request: "Cutoff at 2 PM, not 5 PM"

### Research
- Caffeine half-life: 5-6 hours
- Late caffeine "delays sleep onset by 40+ minutes and reduces deep sleep"

### For 23:00 Bedtime
- 5 PM cutoff = 6h before bed (current)
- 2 PM cutoff = 9h before bed (user preference)

**Recommendation:** Make caffeine cutoff configurable, default to **6-8 hours before bedtime** (14:00-15:00 for 23:00 bed).

---

## 7. Protocol Implementation Changes

### Pre-Departure Days
- **Change from 7 days to 3 days maximum**
- Day -3: Begin shifting (30min earlier)
- Day -2: Continue (1h earlier)
- Day -1: Final prep (1.5h earlier total)

### Wake Time Logic - FIX NEEDED
Current: Shifts wake time from 07:00 → 04:45 (unrealistic)
Fix: **Maximum wake time advance = 2 hours from habitual**
- If habitual wake is 07:00, earliest is 05:00

### Melatonin Timing
- Change from 4.5h before bed to **5-5.5h before bed**
- Add as intervention for eastward travel

### Caffeine
- Change cutoff from bedtime-6h to **14:00 fixed** or bedtime-8h

### Exercise
- Add chronotype-specific guidance
- Morning exercise for eastward
- Include intensity recommendation: moderate cardio (60-75% HR max)

### Creatine (NEW)
- Add as optional intervention
- 5g morning dose for arrival day and active adjustment days
- Include hydration reminder

---

## 8. Visualization Requirements

### Home vs Destination Time Bridge
Show parallel timelines:
```
HOME TIME:     |--sleep--|wake|----day----|bed|
DEST TIME:     |day|bed|--sleep--|wake|----day----|
                    ↑
              Current CBTmin position
```

### Organ Clock Alignment Progress
Track multiple clocks:
1. **SCN (brain)** - Responds to light (fastest, 1-2 days)
2. **Liver** - Responds to meals (3-4 days)
3. **Muscle** - Responds to exercise (2-3 days)
4. **Gut** - Responds to meals (3-4 days)

Show % alignment for each, not just overall progress.

---

## Summary of Changes Needed

1. **Caffeine cutoff:** 2 PM (or bedtime - 8h) ✅ DONE
2. **Pre-departure:** 3 days max ✅ DONE
3. **Wake time shift cap:** Max 2h earlier than habitual ✅ DONE
4. **Melatonin:** 5-5.5h before bed for eastward ✅ DONE
5. **Exercise:** Morning, moderate cardio, chronotype-aware ✅ DONE
6. **Creatine:** New intervention for cognitive support ✅ DONE
7. **Visualization:** Dual timeline + organ clock progress (TODO: UI)
8. **Direction verification:** Eastward = advance = earlier light/bed/wake ✅ DONE

---

## v4.0 Flight Day Improvements (December 2024)

### Problem
Flight day interventions showed useless "00:00-23:59" time windows instead of specific actionable times.

### Solution - Timeshifter-Inspired Approach
1. **Exact timing based on departure/arrival**: All interventions now calculated from actual flight schedule
2. **Destination time context**: Each intervention shows "It's X:XX at destination"
3. **Scientifically optimal nap windows**:
   - 20-minute power nap (stays in light sleep, no grogginess)
   - 90-minute full cycle (complete sleep cycle)
   - Never 30-80 minutes ("danger zone" = waking from deep sleep)
4. **Airline meal timing**: ~1.5h after takeoff, 1.5h before landing
5. **Eat/Skip guidance**: Based on whether it's day or night at destination
6. **Caffeine windows**: Only when it's morning/early afternoon at destination
7. **Melatonin timing**: When it's ~5h before destination bedtime
8. **Light avoidance**: Critical window before CBTmin (prevents wrong-direction shift)
9. **Stay awake vs sleep**: Clear guidance based on destination time

### Melatonin Formulation
- **Fast-release (immediate)** for phase shifting
- NOT slow-release/extended-release (those are for staying asleep, not shifting phase)
- Dose: 0.5-3mg effective for phase shifting

### Scientific Sources
- Timeshifter methodology (Dr. Steven W. Lockley, Harvard)
- Sleep Foundation: Napping science
- NASA nap duration research (26-minute optimal)
- CDC fatigue countermeasures
