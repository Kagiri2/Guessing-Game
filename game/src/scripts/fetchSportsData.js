const axios = require('axios');
const { supabase } = require('../services/supabaseClient');

const SPORTS_DB_API = 'https://www.thesportsdb.com/api/v1/json/3';

async function fetchData(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error.message);
    return null;
  }
}

async function getSports() {
  const data = await fetchData(`${SPORTS_DB_API}/all_sports.php`);
  return data && data.sports ? data.sports : [];
}

async function getLeagues() {
  const data = await fetchData(`${SPORTS_DB_API}/all_leagues.php`);
  return data && data.leagues ? data.leagues : [];
}

async function getTeams(league) {
  const data = await fetchData(`${SPORTS_DB_API}/search_all_teams.php?l=${encodeURIComponent(league)}`);
  return data && data.teams ? data.teams : [];
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
  const categoryId = await getCategoryId('Sports');
  if (!categoryId) {
    console.error('Could not find or create the Sports category.');
    return;
  }

  await clearExistingItems(categoryId);

  const sports = await getSports();
  console.log(`Fetched ${sports.length} sports`);

  const leagues = await getLeagues();
  console.log(`Fetched ${leagues.length} leagues`);

  let totalInserted = 0;

  for (const sport of sports) {
    if (sport.strSportThumb || sport.strSportIconGreen) {
      const sportQuestions = [
        {
          question: "Which sport is represented by this image?",
          answer: [sport.strSport],
          image_url: sport.strSportThumb || sport.strSportIconGreen
        },
        {
          question: `What is the primary equipment used in ${sport.strSport}?`,
          answer: [sport.strSportDescription.split('.')[0]],
          image_url: sport.strSportThumb || sport.strSportIconGreen
        }
      ];

      for (const question of sportQuestions) {
        if (await insertItem(categoryId, question)) {
          totalInserted++;
          console.log(`Inserted question for sport: ${sport.strSport}`);
        }
      }
    } else {
      console.log(`Skipping sport ${sport.strSport} due to missing image`);
    }

    if (totalInserted >= 500) break;
  }

  for (const league of leagues) {
    const teams = await getTeams(league.strLeague);
    console.log(`Fetched ${teams.length} teams for ${league.strLeague}`);

    for (const team of teams) {
      if (team.strTeamBadge) {
        const teamQuestion = {
          question: "Which team's logo is this?",
          answer: [team.strTeam],
          image_url: team.strTeamBadge
        };
        if (await insertItem(categoryId, teamQuestion)) {
          totalInserted++;
          console.log(`Inserted question for team: ${team.strTeam}`);
        }
      }

      if (totalInserted >= 500) break;
    }

    if (totalInserted >= 500) break;

    // Respect API rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`Finished populating database with ${totalInserted} sports items.`);
}

populateDatabase().catch(console.error);