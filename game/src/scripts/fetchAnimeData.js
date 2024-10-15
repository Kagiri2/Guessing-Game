const axios = require('axios');
const { supabase } = require('../services/supabaseClient');

const ANILIST_URL = 'https://graphql.anilist.co';

async function getAnimeData(page = 1, perPage = 50, sort = 'POPULARITY_DESC') {
  const query = `
    query ($page: Int, $perPage: Int, $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: $sort) {
          id
          title {
            romaji
            english
          }
          bannerImage
          characters(sort: ROLE, perPage: 2) {
            nodes {
              id
              name {
                full
              }
              image {
                large
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(ANILIST_URL, {
      query,
      variables: { page, perPage, sort: [sort] }
    });
    return response.data.data.Page.media;
  } catch (error) {
    console.error('Error fetching anime data:', error);
    return [];
  }
}

async function getPopularCharacters(page = 1, perPage = 50) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        characters(sort: FAVOURITES_DESC) {
          id
          name {
            full
          }
          image {
            large
          }
          media(type: ANIME, sort: POPULARITY_DESC) {
            nodes {
              title {
                romaji
                english
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(ANILIST_URL, {
      query,
      variables: { page, perPage }
    });
    return response.data.data.Page.characters;
  } catch (error) {
    console.error('Error fetching character data:', error);
    return [];
  }
}

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

async function populateDatabase() {
  const categoryId = await getCategoryId('Anime/Manga');
  if (!categoryId) {
    console.error('Could not find the Anime/Manga category. Please ensure it exists in the categories table.');
    return;
  }

  await clearExistingItems(categoryId);

  const sortOptions = ['POPULARITY_DESC', 'SCORE_DESC', 'FAVOURITES_DESC', 'TRENDING_DESC'];
  const processedAnimeIds = new Set();
  const processedCharacterIds = new Set();
  let totalInsertedAnime = 0;
  let totalInsertedCharacters = 0;

  // First, insert anime and their characters
  for (const sortOption of sortOptions) {
    let page = 1;
    let insertedAnimeForSort = 0;

    while (insertedAnimeForSort < 100) {
      const animeList = await getAnimeData(page, 50, sortOption);
      
      if (animeList.length === 0) break;

      for (const anime of animeList) {
        if (processedAnimeIds.has(anime.id)) continue;

        processedAnimeIds.add(anime.id);

        if (anime.bannerImage) {
          await insertItem(categoryId, {
            question: "What anime is this scene from?",
            answer: JSON.stringify([anime.title.romaji, anime.title.english].filter(Boolean)),
            image_url: anime.bannerImage
          });

          for (const character of anime.characters.nodes) {
            processedCharacterIds.add(character.id);
            await insertItem(categoryId, {
              question: "Who is this anime character?",
              answer: JSON.stringify([character.name.full]),
              image_url: character.image.large
            });
          }

          insertedAnimeForSort++;
          totalInsertedAnime++;
          console.log(`Processed anime: ${anime.title.romaji} / ${anime.title.english || 'N/A'} (${sortOption})`);
        }

        if (insertedAnimeForSort >= 100) break;
      }

      page++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Respect rate limits
    }

    console.log(`Finished processing ${sortOption}: ${insertedAnimeForSort} anime inserted`);
  }

  // Now, insert additional popular characters
  let characterPage = 1;
  while (totalInsertedCharacters < 1000) {
    const characters = await getPopularCharacters(characterPage, 50);
    
    if (characters.length === 0) break;

    for (const character of characters) {
      if (processedCharacterIds.has(character.id)) continue;
      if (character.media.nodes.length === 0) continue;

      processedCharacterIds.add(character.id);

      const animeTitle = character.media.nodes[0].title;
      await insertItem(categoryId, {
        question: "Which anime is this character from?",
        answer: JSON.stringify([animeTitle.romaji, animeTitle.english].filter(Boolean)),
        image_url: character.image.large
      });

      totalInsertedCharacters++;
      console.log(`Processed character: ${character.name.full}`);

      if (totalInsertedCharacters >= 5000) break;
    }

    characterPage++;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Respect rate limits
  }

  console.log(`Finished populating database with items from ${totalInsertedAnime} unique anime and ${totalInsertedCharacters} additional characters.`);
}

populateDatabase().catch(console.error);