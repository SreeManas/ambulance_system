# Firestore Seeding

Quick reference for populating the database with test data.

## Run Seed Script

```bash
npm run seed:firestore
```

## What Gets Seeded

| Collection | Count | Details |
|------------|-------|---------|
| **hospitals** | 10 | Level 1-3 trauma centers across Bangalore |
| **ambulances** | 8 | 4 ALS + 4 BLS vehicles |
| **emergencyCases** | 5 | Cardiac, trauma, burn, medical, accident cases |

## Hospitals Included

1. Manipal Hospital Whitefield (Level 1)
2. Apollo Hospitals Bannerghatta (Level 1)
3. St. John's Medical College Hospital (Level 2)
4. Fortis Hospital Cunningham Road (Level 2)
5. Columbia Asia Hospital Whitefield (Level 3)
6. Narayana Health City (Level 1)
7. Sakra World Hospital (Level 2)
8. BGS Gleneagles Global Hospital (Level 3)
9. Aster CMI Hospital (Level 2)
10. Sagar Hospital Banashankari (Level 3)

## Emergency Cases

- **Cardiac**: 45-year-old male, chest pain (Acuity 5)
- **Trauma**: 28-year-old female, head injury (Acuity 4)
- **Medical**: 62-year-old male, respiratory distress (Acuity 3)
- **Burn**: 35-year-old female, thermal burns (Acuity 4)
- **Accident**: 19-year-old male, leg fracture (Acuity 3)

## ⚠️ Warning

This script will **clear existing data** in these collections before seeding.

## Dependencies

The script requires `dotenv`:

```bash
npm install dotenv
```

## Manual Firestore Setup

If you need to manually create collections:

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Create collections: `hospitals`, `ambulances`, `emergencyCases`
