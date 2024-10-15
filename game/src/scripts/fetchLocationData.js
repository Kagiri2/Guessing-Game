const axios = require('axios');
const { supabase } = require('../services/supabaseClient');

const WORLD_WONDERS_API_URL = 'https://www.world-wonders-api.org/v0/wonders/';

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

async function fetchWorldWonders() {
  try {
    const response = await axios.get(WORLD_WONDERS_API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching world wonders:', error);
    return [];
  }
}

async function populateDatabase() {
  const categoryId = await getCategoryId('Famous Locations');
  if (!categoryId) {
    console.error('Could not find the Famous Locations category. Please ensure it exists in the categories table.');
    return;
  }

  await clearExistingItems(categoryId);

  const wonders = await fetchWorldWonders();
  let insertedCount = 0;

  for (const wonder of wonders) {
    if (wonder.links && wonder.links.images && wonder.links.images.length > 0) {
      await insertItem(categoryId, {
        question: "What is the name and where is this famous location?",
        answer: JSON.stringify([`${wonder.name}, ${wonder.location}`, `${wonder.name} in ${wonder.location}`]),
        image_url: wonder.links.images[0]
      });

      insertedCount++;
      console.log(`Processed location: ${wonder.name}, ${wonder.location}`);
    }
  }

  console.log(`Finished populating database with ${insertedCount} world wonders.`);
}

populateDatabase().catch(console.error);