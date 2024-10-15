const axios = require('axios');
const { supabase } = require('../services/supabaseClient');

const INATURALIST_API_URL = 'https://api.inaturalist.org/v1/taxa';

// List of common animals
const commonAnimals = [
  "Lion", "Tiger", "Elephant", "Giraffe", "Zebra", "Hippo", "Rhino", "Panda", "Koala", "Kangaroo",
  "Bear", "Wolf", "Fox", "Deer", "Moose", "Raccoon", "Squirrel", "Rabbit", "Hedgehog", "Otter",
  "Dolphin", "Whale", "Shark", "Octopus", "Penguin", "Eagle", "Owl", "Parrot", "Flamingo", "Toucan",
  "Crocodile", "Turtle", "Snake", "Frog", "Butterfly", "Bee", "Ant", "Spider", "Scorpion", "Jellyfish",
  "Gorilla", "Chimpanzee", "Orangutan", "Lemur", "Sloth", "Armadillo", "Platypus", "Tasmanian Devil",
  "Ostrich", "Peacock", "Hummingbird", "Pelican", "Seagull", "Puffin", "Woodpecker", "Chameleon",
  "Iguana", "Komodo Dragon", "Leopard", "Cheetah", "Jaguar", "Lynx", "Hyena", "Meerkat", "Warthog",
  "Bison", "Yak", "Camel", "Llama", "Alpaca", "Porcupine", "Beaver", "Mole", "Bat", "Walrus",
  "Seal", "Sea Lion", "Manatee", "Narwhal", "Swordfish", "Seahorse", "Starfish", "Crab", "Lobster",
  "Praying Mantis", "Ladybug", "Dragonfly", "Stick Insect", "Moth", "Grasshopper", "Cicada", "Firefly"
];

async function getCategoryId(categoryName) {
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('name', categoryName)
    .single();

  if (error) {
    console.error('Error fetching category ID:', error);
    return null;
  }

  return data.id;
}

async function clearExistingItems(categoryId) {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('category_id', categoryId);

  if (error) {
    console.error('Error clearing existing items:', error);
  } else {
    console.log('Existing items cleared successfully.');
  }
}

async function insertItem(categoryId, item) {
  const { error } = await supabase
    .from('items')
    .insert({
      category_id: categoryId,
      question: item.question,
      answer: item.answer,
      image_url: item.image_url
    });
  
  if (error) {
    console.error('Error inserting item:', error);
  }
}

async function fetchAnimalData(animalName) {
  try {
    const response = await axios.get(INATURALIST_API_URL, {
      params: {
        q: animalName,
        per_page: 1,
        order: 'desc',
        order_by: 'observations_count'
      }
    });
    return response.data.results[0];
  } catch (error) {
    console.error(`Error fetching data for ${animalName}:`, error);
    return null;
  }
}

async function populateDatabase() {
  const categoryId = await getCategoryId('Animals');
  if (!categoryId) {
    console.error('Could not find the Animals category. Please ensure it exists in the categories table.');
    return;
  }

  await clearExistingItems(categoryId);

  let insertedAnimals = 0;

  for (const animal of commonAnimals) {
    const animalData = await fetchAnimalData(animal);
    if (animalData && animalData.default_photo) {
      const commonName = animalData.preferred_common_name || animal;
      const scientificName = animalData.name;
      const imageUrl = animalData.default_photo.medium_url;

      await insertItem(categoryId, {
        question: "What is the name of this animal?",
        answer: JSON.stringify([commonName, scientificName]),
        image_url: imageUrl
      });

      insertedAnimals++;
      console.log(`Processed animal: ${commonName} (${scientificName})`);
    } else {
      console.log(`Skipped animal: ${animal} (no data or image available)`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000)); // Respect rate limits
  }

  console.log(`Finished populating database with ${insertedAnimals} common animals.`);
}

populateDatabase().catch(console.error);