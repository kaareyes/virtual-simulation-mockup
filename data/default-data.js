/* Bundled default database (generated from the JSON files). Loaded with a <script> tag so it works from file:// without fetch(). */
window.VE_DEFAULT_DB = {
 "files": {
  "organisms.json": {
   "schemaVersion": 1,
   "organisms": [
    {
     "id": "org_001",
     "scientificName": "Imperata cylindrica",
     "image": "assets/organisms/grass.png",
     "emoji": "",
     "description": "Fast-growing plant that covers the open slopes. Food for many small animals.",
     "hint": "It makes its own food using sunlight.",
     "category": "Plant",
     "diet": "Photosynthesis",
     "preyIds": [],
     "population": 1500,
     "reproductionRate": 0.12,
     "mortalityRate": 0.02,
     "energyValue": 100,
     "ecosystemId": "eco_001",
     "active": true,
     "includeInArrange": true,
     "name": "Grass",
     "trophicLevel": "producer"
    },
    {
     "id": "org_002",
     "scientificName": "Melastoma malabathricum",
     "image": "assets/organisms/bush.png",
     "emoji": "",
     "description": "A woody shrub whose leaves and flowers feed insects and snails.",
     "hint": "It is a plant that makes its own food.",
     "category": "Plant",
     "diet": "Photosynthesis",
     "preyIds": [],
     "population": 600,
     "reproductionRate": 0.1,
     "mortalityRate": 0.02,
     "energyValue": 100,
     "ecosystemId": "eco_001",
     "active": true,
     "includeInArrange": true,
     "name": "Bush",
     "trophicLevel": "producer"
    },
    {
     "id": "org_003",
     "scientificName": "Shorea sp.",
     "image": "assets/organisms/tree.png",
     "emoji": "",
     "description": "Tall forest tree that gives shade, shelter and leaves for caterpillars.",
     "hint": "Big plant that uses sunlight to make food.",
     "category": "Plant",
     "diet": "Photosynthesis",
     "preyIds": [],
     "population": 300,
     "reproductionRate": 0.08,
     "mortalityRate": 0.015,
     "energyValue": 100,
     "ecosystemId": "eco_001",
     "active": true,
     "includeInArrange": true,
     "name": "Tree",
     "trophicLevel": "producer"
    },
    {
     "id": "org_004",
     "scientificName": "Oxya sp.",
     "image": "assets/organisms/grasshopper.png",
     "emoji": "",
     "description": "Jumping insect that chews grass and leaves.",
     "hint": "It eats grass, so it eats producers.",
     "category": "Insect",
     "diet": "Herbivore",
     "preyIds": [
      "org_001",
      "org_002"
     ],
     "population": 300,
     "reproductionRate": 0.1,
     "mortalityRate": 0.05,
     "energyValue": 10,
     "ecosystemId": "eco_001",
     "active": true,
     "includeInArrange": true,
     "name": "Grasshopper",
     "trophicLevel": "primary_consumer"
    },
    {
     "id": "org_005",
     "scientificName": "Lepidoptera (larva)",
     "image": "assets/organisms/caterpillar.png",
     "emoji": "",
     "description": "Young butterfly or moth that eats leaves all day.",
     "hint": "It munches on leaves, so it eats producers.",
     "category": "Insect",
     "diet": "Herbivore",
     "preyIds": [
      "org_002",
      "org_003"
     ],
     "population": 250,
     "reproductionRate": 0.1,
     "mortalityRate": 0.05,
     "energyValue": 10,
     "ecosystemId": "eco_001",
     "active": true,
     "includeInArrange": true,
     "name": "Caterpillar",
     "trophicLevel": "primary_consumer"
    },
    {
     "id": "org_006",
     "scientificName": "Achatina fulica",
     "image": "assets/organisms/snail.png",
     "emoji": "",
     "description": "Slow mollusc that grazes on soft leaves and grass.",
     "hint": "It eats plants, so it eats producers.",
     "category": "Mollusc",
     "diet": "Herbivore",
     "preyIds": [
      "org_001",
      "org_002"
     ],
     "population": 150,
     "reproductionRate": 0.09,
     "mortalityRate": 0.045,
     "energyValue": 10,
     "ecosystemId": "eco_001",
     "active": true,
     "includeInArrange": true,
     "name": "Snail",
     "trophicLevel": "primary_consumer"
    },
    {
     "id": "org_007",
     "scientificName": "Fejervarya sp.",
     "image": "assets/organisms/frog.png",
     "emoji": "",
     "description": "Eats insects.",
     "hint": "It eats insects, which are primary consumers.",
     "category": "Amphibian",
     "diet": "Insectivore",
     "preyIds": [
      "org_004",
      "org_005",
      "org_006"
     ],
     "population": 60,
     "reproductionRate": 0.07,
     "mortalityRate": 0.04,
     "energyValue": 1,
     "ecosystemId": "eco_001",
     "active": true,
     "includeInArrange": true,
     "name": "Frog",
     "trophicLevel": "secondary_consumer"
    },
    {
     "id": "org_008",
     "scientificName": "Eutropis multifasciata",
     "image": "assets/organisms/lizard.png",
     "emoji": "",
     "description": "Quick reptile that hunts insects on the forest floor.",
     "hint": "It eats insects, which are primary consumers.",
     "category": "Reptile",
     "diet": "Insectivore",
     "preyIds": [
      "org_004",
      "org_005"
     ],
     "population": 50,
     "reproductionRate": 0.07,
     "mortalityRate": 0.04,
     "energyValue": 1,
     "ecosystemId": "eco_001",
     "active": true,
     "includeInArrange": true,
     "name": "Lizard",
     "trophicLevel": "secondary_consumer"
    },
    {
     "id": "org_009",
     "scientificName": "Coelognathus erythrurus",
     "image": "assets/organisms/snake.png",
     "emoji": "",
     "description": "Hunts frogs and lizards.",
     "hint": "It eats frogs and lizards, which are secondary consumers.",
     "category": "Reptile",
     "diet": "Carnivore",
     "preyIds": [
      "org_007",
      "org_008"
     ],
     "population": 12,
     "reproductionRate": 0.05,
     "mortalityRate": 0.03,
     "energyValue": 0.1,
     "ecosystemId": "eco_001",
     "active": true,
     "includeInArrange": true,
     "name": "Snake",
     "trophicLevel": "tertiary_consumer"
    },
    {
     "id": "org_010",
     "scientificName": "Pithecophaga jefferyi",
     "image": "assets/organisms/eagle.png",
     "emoji": "",
     "description": "A powerful bird of prey that hunts from above.",
     "hint": "Almost nothing hunts it. It is at the top.",
     "category": "Bird",
     "diet": "Carnivore",
     "preyIds": [
      "org_009",
      "org_008",
      "org_007"
     ],
     "population": 4,
     "reproductionRate": 0.04,
     "mortalityRate": 0.025,
     "energyValue": 0.01,
     "ecosystemId": "eco_001",
     "active": true,
     "includeInArrange": true,
     "name": "Eagle",
     "trophicLevel": "top_predator"
    },
    {
     "id": "org_011",
     "scientificName": "",
     "image": "assets/organisms/decomposers.png",
     "emoji": "",
     "description": "Break down dead plants and animals and return nutrients to the soil.",
     "hint": "They recycle nutrients.",
     "category": "Decomposer",
     "diet": "Dead matter",
     "preyIds": [],
     "population": 0,
     "reproductionRate": 0,
     "mortalityRate": 0,
     "energyValue": 0,
     "ecosystemId": "eco_001",
     "active": true,
     "includeInArrange": false,
     "name": "Bacteria & Fungi",
     "trophicLevel": "decomposer"
    },
    {
     "id": "org_012",
     "scientificName": "Chlorella sp.",
     "image": "",
     "emoji": "🌿",
     "description": "Tiny green plants that float in the water.",
     "hint": "It makes its own food using sunlight.",
     "category": "Plant",
     "diet": "Photosynthesis",
     "preyIds": [],
     "population": 2000,
     "reproductionRate": 0.14,
     "mortalityRate": 0.02,
     "energyValue": 100,
     "ecosystemId": "eco_002",
     "active": true,
     "includeInArrange": true,
     "name": "Algae",
     "trophicLevel": "producer"
    },
    {
     "id": "org_013",
     "scientificName": "Nymphaea sp.",
     "image": "",
     "emoji": "🪷",
     "description": "Floating plant with big leaves and bright flowers.",
     "hint": "It is a plant.",
     "category": "Plant",
     "diet": "Photosynthesis",
     "preyIds": [],
     "population": 400,
     "reproductionRate": 0.08,
     "mortalityRate": 0.015,
     "energyValue": 100,
     "ecosystemId": "eco_002",
     "active": true,
     "includeInArrange": true,
     "name": "Water Lily",
     "trophicLevel": "producer"
    },
    {
     "id": "org_014",
     "scientificName": "Daphnia sp.",
     "image": "",
     "emoji": "🦐",
     "description": "Tiny crustacean that filters algae from the water.",
     "hint": "It eats algae.",
     "category": "Crustacean",
     "diet": "Herbivore",
     "preyIds": [
      "org_012"
     ],
     "population": 400,
     "reproductionRate": 0.12,
     "mortalityRate": 0.06,
     "energyValue": 10,
     "ecosystemId": "eco_002",
     "active": true,
     "includeInArrange": true,
     "name": "Water Flea",
     "trophicLevel": "primary_consumer"
    },
    {
     "id": "org_015",
     "scientificName": "Pila sp.",
     "image": "",
     "emoji": "🐌",
     "description": "Grazes on algae and soft plants.",
     "hint": "It eats plants and algae.",
     "category": "Mollusc",
     "diet": "Herbivore",
     "preyIds": [
      "org_012",
      "org_013"
     ],
     "population": 150,
     "reproductionRate": 0.08,
     "mortalityRate": 0.04,
     "energyValue": 10,
     "ecosystemId": "eco_002",
     "active": true,
     "includeInArrange": true,
     "name": "Pond Snail",
     "trophicLevel": "primary_consumer"
    },
    {
     "id": "org_016",
     "scientificName": "Oreochromis niloticus",
     "image": "",
     "emoji": "🐟",
     "description": "Common freshwater fish that eats plants and small animals.",
     "hint": "It eats water fleas and snails.",
     "category": "Fish",
     "diet": "Omnivore",
     "preyIds": [
      "org_014",
      "org_015"
     ],
     "population": 60,
     "reproductionRate": 0.07,
     "mortalityRate": 0.04,
     "energyValue": 1,
     "ecosystemId": "eco_002",
     "active": true,
     "includeInArrange": true,
     "name": "Tilapia",
     "trophicLevel": "secondary_consumer"
    },
    {
     "id": "org_017",
     "scientificName": "Clarias sp.",
     "image": "",
     "emoji": "🐠",
     "description": "Night hunter that eats smaller fish.",
     "hint": "It eats tilapia.",
     "category": "Fish",
     "diet": "Carnivore",
     "preyIds": [
      "org_016"
     ],
     "population": 12,
     "reproductionRate": 0.05,
     "mortalityRate": 0.03,
     "energyValue": 0.1,
     "ecosystemId": "eco_002",
     "active": true,
     "includeInArrange": true,
     "name": "Catfish",
     "trophicLevel": "tertiary_consumer"
    },
    {
     "id": "org_018",
     "scientificName": "Ardea sp.",
     "image": "",
     "emoji": "🦢",
     "description": "Tall wading bird that spears fish.",
     "hint": "It stands at the top.",
     "category": "Bird",
     "diet": "Carnivore",
     "preyIds": [
      "org_017",
      "org_016"
     ],
     "population": 4,
     "reproductionRate": 0.04,
     "mortalityRate": 0.025,
     "energyValue": 0.01,
     "ecosystemId": "eco_002",
     "active": true,
     "includeInArrange": true,
     "name": "Heron",
     "trophicLevel": "top_predator"
    },
    {
     "id": "org_019",
     "scientificName": "Oryza sativa",
     "image": "",
     "emoji": "🌾",
     "description": "The main crop of the paddy.",
     "hint": "A plant.",
     "category": "Plant",
     "diet": "Photosynthesis",
     "preyIds": [],
     "population": 1800,
     "reproductionRate": 0.12,
     "mortalityRate": 0.02,
     "energyValue": 100,
     "ecosystemId": "eco_003",
     "active": true,
     "includeInArrange": true,
     "name": "Rice",
     "trophicLevel": "producer"
    },
    {
     "id": "org_020",
     "scientificName": "Zea mays",
     "image": "",
     "emoji": "🌽",
     "description": "A tall grain crop planted on dry fields.",
     "hint": "A plant.",
     "category": "Plant",
     "diet": "Photosynthesis",
     "preyIds": [],
     "population": 700,
     "reproductionRate": 0.1,
     "mortalityRate": 0.02,
     "energyValue": 100,
     "ecosystemId": "eco_003",
     "active": true,
     "includeInArrange": true,
     "name": "Corn",
     "trophicLevel": "producer"
    },
    {
     "id": "org_021",
     "scientificName": "Leptocorisa oratoria",
     "image": "",
     "emoji": "🪲",
     "description": "Sucks the juice from young rice grains.",
     "hint": "It eats crops.",
     "category": "Insect",
     "diet": "Herbivore",
     "preyIds": [
      "org_019",
      "org_020"
     ],
     "population": 350,
     "reproductionRate": 0.1,
     "mortalityRate": 0.05,
     "energyValue": 10,
     "ecosystemId": "eco_003",
     "active": true,
     "includeInArrange": true,
     "name": "Rice Bug",
     "trophicLevel": "primary_consumer"
    },
    {
     "id": "org_022",
     "scientificName": "Spodoptera sp.",
     "image": "",
     "emoji": "🐛",
     "description": "Caterpillar that eats crop leaves.",
     "hint": "It eats leaves.",
     "category": "Insect",
     "diet": "Herbivore",
     "preyIds": [
      "org_019",
      "org_020"
     ],
     "population": 200,
     "reproductionRate": 0.1,
     "mortalityRate": 0.05,
     "energyValue": 10,
     "ecosystemId": "eco_003",
     "active": true,
     "includeInArrange": true,
     "name": "Armyworm",
     "trophicLevel": "primary_consumer"
    },
    {
     "id": "org_023",
     "scientificName": "Fejervarya vittigera",
     "image": "",
     "emoji": "🐸",
     "description": "Helps farmers by eating insect pests.",
     "hint": "It eats insects.",
     "category": "Amphibian",
     "diet": "Insectivore",
     "preyIds": [
      "org_021",
      "org_022"
     ],
     "population": 60,
     "reproductionRate": 0.07,
     "mortalityRate": 0.04,
     "energyValue": 1,
     "ecosystemId": "eco_003",
     "active": true,
     "includeInArrange": true,
     "name": "Paddy Frog",
     "trophicLevel": "secondary_consumer"
    },
    {
     "id": "org_024",
     "scientificName": "Ptyas korros",
     "image": "",
     "emoji": "🐍",
     "description": "Hunts frogs and rodents in the fields.",
     "hint": "It eats frogs.",
     "category": "Reptile",
     "diet": "Carnivore",
     "preyIds": [
      "org_023"
     ],
     "population": 12,
     "reproductionRate": 0.05,
     "mortalityRate": 0.03,
     "energyValue": 0.1,
     "ecosystemId": "eco_003",
     "active": true,
     "includeInArrange": true,
     "name": "Rat Snake",
     "trophicLevel": "tertiary_consumer"
    },
    {
     "id": "org_025",
     "scientificName": "Tyto alba",
     "image": "",
     "emoji": "🦉",
     "description": "Silent night hunter.",
     "hint": "It sits at the top.",
     "category": "Bird",
     "diet": "Carnivore",
     "preyIds": [
      "org_024",
      "org_023"
     ],
     "population": 4,
     "reproductionRate": 0.04,
     "mortalityRate": 0.025,
     "energyValue": 0.01,
     "ecosystemId": "eco_003",
     "active": true,
     "includeInArrange": true,
     "name": "Barn Owl",
     "trophicLevel": "top_predator"
    }
   ]
  },
  "ecosystems.json": {
   "schemaVersion": 1,
   "ecosystems": [
    {
     "id": "eco_001",
     "name": "Mt. Agad-Agad Forest",
     "shortName": "Mt. Agad-Agad",
     "location": "Mt. Agad-Agad, Philippines",
     "description": "A lush tropical mountain forest with grassy slopes, shrubs and tall trees.",
     "backgroundImage": "assets/backgrounds/mt-agad-agad.jpg",
     "simBackground": "assets/backgrounds/ecosystem-landscape.png",
     "environment": {
      "sunlight": 80,
      "rainfall": 70,
      "temperature": 24
     },
     "pyramid": [
      {
       "id": "producer",
       "label": "Producer",
       "shortLabel": "Producer",
       "color": "#5aa63f",
       "simGroup": "producer",
       "description": "Makes its own food using sunlight.",
       "energyDescription": "Makes its own food using sunlight.",
       "energyLabel": "Most",
       "role": "Captures energy from sunlight through photosynthesis and feeds every other level.",
       "eatsText": "Makes its own food using sunlight.",
       "diet": "Plants"
      },
      {
       "id": "primary_consumer",
       "label": "Primary Consumer",
       "shortLabel": "Herbivore",
       "color": "#1ab3d0",
       "simGroup": "herbivore",
       "description": "Eats producers.",
       "energyDescription": "Eats plants (producers).",
       "energyLabel": "More",
       "role": "Moves energy from plants to animals. Controls plant growth by grazing.",
       "eatsText": "Eats producers.",
       "diet": "Herbivore"
      },
      {
       "id": "secondary_consumer",
       "label": "Secondary Consumer",
       "shortLabel": "Omnivore",
       "color": "#f5c518",
       "simGroup": "omnivore",
       "description": "Eats primary consumers.",
       "energyDescription": "Eats plants and animals.",
       "energyLabel": "Some",
       "role": "Controls the number of herbivores.",
       "eatsText": "Eats primary consumers.",
       "diet": "Omnivore"
      },
      {
       "id": "tertiary_consumer",
       "label": "Tertiary Consumer",
       "shortLabel": "Omnivore",
       "color": "#8c4bd1",
       "simGroup": "omnivore",
       "description": "Eats secondary consumers.",
       "energyDescription": "Eats plants and animals.",
       "energyLabel": "Less",
       "role": "Controls the number of secondary consumers.",
       "eatsText": "Eats secondary consumers.",
       "diet": "Omnivore"
      },
      {
       "id": "top_predator",
       "label": "Top Predator",
       "shortLabel": "Top Predator",
       "color": "#ee3b3b",
       "simGroup": "top",
       "description": "Sits at the top. Few or no other organisms eat it.",
       "energyDescription": "Sits at the top. Few or no other organisms eat it.",
       "energyLabel": "Least",
       "role": "Keeps the whole food web in balance. Needs a large area to find enough food.",
       "eatsText": "Eats other consumers.",
       "diet": "Carnivore"
      }
     ],
     "decomposerNote": "Bacteria & Fungi",
     "active": true
    },
    {
     "id": "eco_002",
     "name": "Local Freshwater Ecosystem",
     "shortName": "Freshwater Pond",
     "location": "Local pond or river",
     "description": "A pond ecosystem where algae feed tiny animals, fish and wading birds.",
     "backgroundImage": "",
     "simBackground": "",
     "environment": {
      "sunlight": 75,
      "rainfall": 80,
      "temperature": 27
     },
     "pyramid": [
      {
       "id": "producer",
       "label": "Producer",
       "shortLabel": "Producer",
       "color": "#5aa63f",
       "simGroup": "producer",
       "description": "Makes its own food using sunlight.",
       "energyDescription": "Makes its own food using sunlight.",
       "energyLabel": "Most",
       "role": "Captures energy from sunlight through photosynthesis and feeds every other level.",
       "eatsText": "Makes its own food using sunlight.",
       "diet": "Plants"
      },
      {
       "id": "primary_consumer",
       "label": "Primary Consumer",
       "shortLabel": "Herbivore",
       "color": "#1ab3d0",
       "simGroup": "herbivore",
       "description": "Eats producers.",
       "energyDescription": "Eats plants (producers).",
       "energyLabel": "More",
       "role": "Moves energy from plants to animals. Controls plant growth by grazing.",
       "eatsText": "Eats producers.",
       "diet": "Herbivore"
      },
      {
       "id": "secondary_consumer",
       "label": "Secondary Consumer",
       "shortLabel": "Omnivore",
       "color": "#f5c518",
       "simGroup": "omnivore",
       "description": "Eats primary consumers.",
       "energyDescription": "Eats plants and animals.",
       "energyLabel": "Some",
       "role": "Controls the number of herbivores.",
       "eatsText": "Eats primary consumers.",
       "diet": "Omnivore"
      },
      {
       "id": "tertiary_consumer",
       "label": "Tertiary Consumer",
       "shortLabel": "Omnivore",
       "color": "#8c4bd1",
       "simGroup": "omnivore",
       "description": "Eats secondary consumers.",
       "energyDescription": "Eats plants and animals.",
       "energyLabel": "Less",
       "role": "Controls the number of secondary consumers.",
       "eatsText": "Eats secondary consumers.",
       "diet": "Omnivore"
      },
      {
       "id": "top_predator",
       "label": "Top Predator",
       "shortLabel": "Top Predator",
       "color": "#ee3b3b",
       "simGroup": "top",
       "description": "Sits at the top. Few or no other organisms eat it.",
       "energyDescription": "Sits at the top. Few or no other organisms eat it.",
       "energyLabel": "Least",
       "role": "Keeps the whole food web in balance. Needs a large area to find enough food.",
       "eatsText": "Eats other consumers.",
       "diet": "Carnivore"
      }
     ],
     "decomposerNote": "Bacteria & Fungi",
     "active": true
    },
    {
     "id": "eco_003",
     "name": "Agricultural Ecosystem",
     "shortName": "Rice Field",
     "location": "Local farmland",
     "description": "A rice and corn field where insects, frogs, snakes and owls share the food web.",
     "backgroundImage": "",
     "simBackground": "",
     "environment": {
      "sunlight": 85,
      "rainfall": 60,
      "temperature": 28
     },
     "pyramid": [
      {
       "id": "producer",
       "label": "Producer",
       "shortLabel": "Producer",
       "color": "#5aa63f",
       "simGroup": "producer",
       "description": "Makes its own food using sunlight.",
       "energyDescription": "Makes its own food using sunlight.",
       "energyLabel": "Most",
       "role": "Captures energy from sunlight through photosynthesis and feeds every other level.",
       "eatsText": "Makes its own food using sunlight.",
       "diet": "Plants"
      },
      {
       "id": "primary_consumer",
       "label": "Primary Consumer",
       "shortLabel": "Herbivore",
       "color": "#1ab3d0",
       "simGroup": "herbivore",
       "description": "Eats producers.",
       "energyDescription": "Eats plants (producers).",
       "energyLabel": "More",
       "role": "Moves energy from plants to animals. Controls plant growth by grazing.",
       "eatsText": "Eats producers.",
       "diet": "Herbivore"
      },
      {
       "id": "secondary_consumer",
       "label": "Secondary Consumer",
       "shortLabel": "Omnivore",
       "color": "#f5c518",
       "simGroup": "omnivore",
       "description": "Eats primary consumers.",
       "energyDescription": "Eats plants and animals.",
       "energyLabel": "Some",
       "role": "Controls the number of herbivores.",
       "eatsText": "Eats primary consumers.",
       "diet": "Omnivore"
      },
      {
       "id": "tertiary_consumer",
       "label": "Tertiary Consumer",
       "shortLabel": "Omnivore",
       "color": "#8c4bd1",
       "simGroup": "omnivore",
       "description": "Eats secondary consumers.",
       "energyDescription": "Eats plants and animals.",
       "energyLabel": "Less",
       "role": "Controls the number of secondary consumers.",
       "eatsText": "Eats secondary consumers.",
       "diet": "Omnivore"
      },
      {
       "id": "top_predator",
       "label": "Top Predator",
       "shortLabel": "Top Predator",
       "color": "#ee3b3b",
       "simGroup": "top",
       "description": "Sits at the top. Few or no other organisms eat it.",
       "energyDescription": "Sits at the top. Few or no other organisms eat it.",
       "energyLabel": "Least",
       "role": "Keeps the whole food web in balance. Needs a large area to find enough food.",
       "eatsText": "Eats other consumers.",
       "diet": "Carnivore"
      }
     ],
     "decomposerNote": "Bacteria & Fungi",
     "active": true
    }
   ]
  },
  "lessons.json": {
   "schemaVersion": 1,
   "lessons": [
    {
     "id": "les_001",
     "title": "Trophic Levels",
     "subtitle": "Trophic Levels",
     "order": 1,
     "enabled": true,
     "description": "Learn about the levels of a food pyramid and how they depend on each other.",
     "objectives": [
      "Identify the trophic levels in a food pyramid.",
      "Describe each trophic level as a level of energy in a food pyramid.",
      "Explain how a change in the number of organisms in one level affects the other levels."
     ],
     "activities": [
      {
       "id": "act_001",
       "type": "explore",
       "group": "Explore",
       "title": "Explore",
       "enabled": true,
       "mode": "qualitative",
       "instructions": "Click a level of the pyramid to learn about it.",
       "hint": ""
      },
      {
       "id": "act_002",
       "type": "arrange",
       "group": "Arrange",
       "title": "Arrange",
       "enabled": true,
       "excludeOrganismIds": [
        "org_008"
       ],
       "instructions": "Drag each organism to the level of the pyramid where it belongs. Tap an organism to see a hint.",
       "hint": "Think about what each organism eats."
      },
      {
       "id": "act_003",
       "type": "simulation",
       "group": "Ecosystem",
       "title": "Ecosystem",
       "enabled": true,
       "instructions": "Change how many organisms are in each level (1 to 5), press Play and watch the populations change.",
       "hint": "Try removing all producers."
      }
     ]
    },
    {
     "id": "les_002",
     "title": "Transfer of Energy",
     "subtitle": "Transfer of Energy",
     "order": 2,
     "enabled": true,
     "description": "Follow the energy from the sun through the food pyramid.",
     "objectives": [
      "Use a food pyramid example to describe how energy moves from one trophic level to the next.",
      "Describe how much energy passes to the next level and where the rest goes.",
      "Explain why there are fewer organisms at the top of the food pyramid."
     ],
     "activities": [
      {
       "id": "act_004",
       "type": "explore",
       "group": "Explore",
       "title": "Explore",
       "enabled": true,
       "mode": "percent",
       "instructions": "Click a level of the pyramid to see how much energy it receives.",
       "hint": ""
      },
      {
       "id": "act_005",
       "type": "arrange",
       "group": "Arrange",
       "title": "Arrange Organisms",
       "enabled": true,
       "excludeOrganismIds": [
        "org_008"
       ],
       "instructions": "Drag each organism to the level where it belongs.",
       "hint": "Think about what each organism eats."
      },
      {
       "id": "act_006",
       "type": "arrangeEnergy",
       "group": "Arrange",
       "title": "Arrange Energy",
       "enabled": true,
       "decoys": [
        "50%",
        "5%",
        "0.5%"
       ],
       "instructions": "Drag each energy value to the correct level. About 10% passes to the next level.",
       "hint": "Each level gets about one tenth of the level below it."
      },
      {
       "id": "act_007",
       "type": "energyAnimation",
       "group": "Transfer",
       "title": "Transfer of Energy",
       "enabled": true,
       "instructions": "Watch how energy moves up the pyramid. Press Next to go step by step.",
       "hint": ""
      }
     ]
    }
   ]
  },
  "simulation-settings.json": {
   "schemaVersion": 1,
   "simulationSettings": [
    {
     "id": "sim_001",
     "ecosystemId": "eco_001",
     "durationDays": 60,
     "daysPerSecond": 1.5,
     "seed": 2026,
     "noise": 0.02,
     "substeps": 4,
     "carryingCapacityMultiplier": 1.5,
     "transferPercent": 10,
     "predationPressure": 0.15,
     "starvationFactor": 1,
     "halfSaturationRatio": 5
    },
    {
     "id": "sim_002",
     "ecosystemId": "eco_002",
     "durationDays": 60,
     "daysPerSecond": 1.5,
     "seed": 2027,
     "noise": 0.02,
     "substeps": 4,
     "carryingCapacityMultiplier": 1.5,
     "transferPercent": 10,
     "predationPressure": 0.15,
     "starvationFactor": 1,
     "halfSaturationRatio": 5
    },
    {
     "id": "sim_003",
     "ecosystemId": "eco_003",
     "durationDays": 60,
     "daysPerSecond": 1.5,
     "seed": 2028,
     "noise": 0.02,
     "substeps": 4,
     "carryingCapacityMultiplier": 1.5,
     "transferPercent": 10,
     "predationPressure": 0.15,
     "starvationFactor": 1,
     "halfSaturationRatio": 5
    }
   ]
  },
  "app-settings.json": {
   "schemaVersion": 1,
   "appSettings": {
    "appTitle": "ENERGY FLOW IN THE ECOSYSTEM OF {ecosystem}",
    "footerText": "A Science Learning Resource",
    "defaultEcosystemId": "eco_001",
    "defaultLanguage": "en",
    "soundDefault": true,
    "lockSteps": true,
    "adminPin": "1234",
    "adminPinEnabled": true,
    "maxBackups": 10
   }
  },
  "database.json": {
   "schemaVersion": 1,
   "name": "Virtual Ecosystem Database",
   "revision": 1,
   "updatedAt": "2026-10-27T00:00:00.000Z",
   "files": [
    "organisms.json",
    "ecosystems.json",
    "lessons.json",
    "simulation-settings.json",
    "app-settings.json"
   ],
   "note": "Manifest for the JSON database. Records live in the other files."
  }
 }
};
