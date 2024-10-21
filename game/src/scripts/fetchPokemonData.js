const axios = require('axios');
const { supabase } = require('../services/supabaseClient');

const POKE_API = 'https://pokeapi.co/api/v2';

async function fetchData(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error.message);
    return null;
  }
}

async function getAllPokemon() {
  let url = `${POKE_API}/pokemon?limit=100000`;  // Set a high limit to get all Pokémon
  const data = await fetchData(url);
  return data ? data.results : [];
}

async function getPokemonDetails(url) {
  return await fetchData(url);
}

async function getCategoryId(categoryName) {
  let { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('name', categoryName)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
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
      answer: JSON.stringify(item.answer),
      image_url: item.image_url
    });
  
  if (error) {
    console.error('Error inserting item:', error);
    return false;
  }
  return true;
}

async function populateDatabase() {
  const categoryId = await getCategoryId('Pokémon');
  if (!categoryId) {
    console.error('Could not find or create the Pokémon category.');
    return;
  }

  await clearExistingItems(categoryId);

  const allPokemon = await getAllPokemon();
  console.log(`Fetched ${allPokemon.length} Pokémon`);

  let totalInserted = 0;

  for (const pokemon of allPokemon) {
    const details = await getPokemonDetails(pokemon.url);
    if (details) {
      const questions = [
        {
          question: "Who's that Pokémon?",
          answer: [details.name],
          image_url: details.sprites.front_default || details.sprites.other['official-artwork'].front_default
        },
        {
          question: `What type(s) of Pokémon is ${details.name}?`,
          answer: details.types.map(type => type.type.name),
          image_url: details.sprites.front_default || details.sprites.other['official-artwork'].front_default
        },
        {
          question: `What is one of ${details.name}'s abilities?`,
          answer: details.abilities.map(ability => ability.ability.name),
          image_url: details.sprites.front_default || details.sprites.other['official-artwork'].front_default
        }
      ];

      for (const question of questions) {
        if (await insertItem(categoryId, question)) {
          totalInserted++;
          console.log(`Inserted question for Pokémon: ${details.name} (Total: ${totalInserted})`);
        }
      }
    }

    // Respect API rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`Finished populating database with ${totalInserted} Pokémon items.`);
}

populateDatabase().catch(console.error);