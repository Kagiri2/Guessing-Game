const axios = require('axios');
const { supabase } = require('../services/supabaseClient');

const REST_COUNTRIES_API = 'https://restcountries.com/v3.1/all';

async function getCountryData() {
  try {
    const response = await axios.get(REST_COUNTRIES_API);
    return response.data;
  } catch (error) {
    console.error('Error fetching country data:', error);
    return [];
  }
}

async function getCategoryId(categoryName) {
  let { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('name', categoryName)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Category doesn't exist, let's create it
      const { data: newCategory, error: insertError } = await supabase
        .from('categories')
        .insert({ name: categoryName })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error creating new category:', insertError);
        return null;
      }

      return newCategory.id;
    }
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

async function populateDatabase() {
  const categoryId = await getCategoryId('Flags');
  if (!categoryId) {
    console.error('Could not find or create the Flags category.');
    return;
  }

  await clearExistingItems(categoryId);

  const countries = await getCountryData();
  let totalInserted = 0;

  for (const country of countries) {
    if (!country.flags || !country.flags.png) continue;

    const commonName = country.name.common;
    const officialName = country.name.official;
    const capital = country.capital ? country.capital[0] : null;

    // Create questions
    const questions = [
      {
        question: "Which country does this flag belong to?",
        answer: JSON.stringify([commonName, officialName]),
        image_url: country.flags.png
      }
    ];

    if (capital) {
      questions.push({
        question: `What is the capital of the country with this flag?`,
        answer: JSON.stringify([capital]),
        image_url: country.flags.png
      });
    }

    for (const question of questions) {
      await insertItem(categoryId, question);
      totalInserted++;
      console.log(`Inserted question for: ${commonName}`);
    }
  }

  console.log(`Finished populating database with ${totalInserted} flag items.`);
}

populateDatabase().catch(console.error);