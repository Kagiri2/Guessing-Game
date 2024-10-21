const axios = require('axios');
const { supabase } = require('../services/supabaseClient');

const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';

// List of popular K-pop artists and groups to fetch
const kpopArtists = [
    // Boy Groups
    'BTS_(band)', 'EXO_(band)', 'Seventeen_(South_Korean_band)', 'NCT_(band)', 'Stray_Kids',
    'Got7', 'Monsta_X', 'Ateez', 'Tomorrow_X_Together', 'Enhypen',
    'The_Boyz_(South_Korean_band)', 'Astro_(South_Korean_band)', 'Treasure_(band)', 'Oneus', 'Pentagon_(South_Korean_band)',
    'SF9', 'Victon', 'Golden_Child_(band)', 'AB6IX', 'CIX_(band)',
    'P1Harmony', 'Cravity', 'Verivery', 'Drippin_(band)', 'E\'last',
  
    // Girl Groups
    'Blackpink', 'Twice_(group)', 'Red_Velvet_(group)', 'Itzy', 'Aespa',
    'Mamamoo', '(G)I-dle', 'Ive_(group)', 'NewJeans', 'Le_Sserafim',
    'Dreamcatcher_(group)', 'Loona_(group)', 'Everglow', 'Nmixx', 'Purple_Kiss',
    'Weeekly', 'StayC', 'Billlie', 'Lightsum', 'Woo!ah!',
  
    // Co-ed Groups
    'KARD_(group)', 'K.A.R.D', 'Triple_H_(group)', 'AKMU', 'Ssak3',
  
    // Solo Artists
    'IU_(singer)', 'Taeyeon', 'Baekhyun', 'Chungha', 'Hwasa',
    'Taemin', 'Sunmi', 'Kang_Daniel', 'Zico_(rapper)', 'HyunA',
    'Jessi_(musician)', 'Somi_(singer)', 'Lee_Hi', 'Crush_(singer)', 'Heize',
    'Dean_(South_Korean_singer)', 'Zico_(rapper)', 'Bibi_(singer)', 'Lee_Mujin', 'Younha',
  
    // BTS Members
    'RM_(rapper)', 'Jin_(singer)', 'Suga_(rapper)', 'J-Hope', 'Jimin_(singer)',
    'V_(singer)', 'Jungkook',
  
    // Blackpink Members
    'Jisoo_(singer)', 'Jennie_(singer)', 'Rosé_(singer)', 'Lisa_(rapper)',
  
    // EXO Members
    'Xiumin', 'Suho_(singer)', 'Lay_(singer)', 'Baekhyun', 'Chen_(singer)',
    'Chanyeol', 'D.O._(singer)', 'Kai_(singer)', 'Sehun',
  
    // Twice Members
    'Nayeon', 'Jeongyeon', 'Momo_(singer)', 'Sana_(singer)', 'Jihyo',
    'Mina_(singer)', 'Dahyun', 'Chaeyoung', 'Tzuyu',
  
    // Red Velvet Members
    'Irene_(singer)', 'Seulgi', 'Wendy_(singer)', 'Joy_(singer)', 'Yeri',
  
    // NCT Members (including all subunits)
    'Taeyong_(singer)', 'Taeil_(singer)', 'Johnny_(singer)', 'Yuta_(singer)', 'Kun_(singer)',
    'Doyoung_(singer)', 'Ten_(singer)', 'Jaehyun_(singer)', 'Winwin', 'Jungwoo_(singer)',
    'Lucas_(entertainer)', 'Mark_Lee_(singer)', 'Xiaojun', 'Hendery', 'Renjun',
    'Jeno', 'Haechan', 'Jaemin', 'Yangyang_(singer)', 'Shotaro',
    'Sungchan',
  
    // Seventeen Members
    'S.Coups', 'Jeonghan_(singer)', 'Joshua_(singer)', 'Jun_(singer)', 'Hoshi_(singer)',
    'Wonwoo', 'Woozi_(singer)', 'DK_(singer)', 'Mingyu_(singer)', 'The8_(singer)',
    'Seungkwan', 'Vernon_(singer)', 'Dino_(singer)',
  
    // Mamamoo Members
    'Solar_(singer)', 'Moonbyul', 'Wheein', 'Hwasa',
  
    // (G)I-dle Members
    'Miyeon', 'Minnie_(singer)', 'Soyeon_(rapper)', 'Yuqi', 'Shuhua',
  
    // Itzy Members
    'Yeji', 'Lia_(singer)', 'Ryujin', 'Chaeryeong', 'Yuna_(singer,_born_2003)',
  
    // Stray Kids Members
    'Bang_Chan', 'Lee_Know', 'Changbin', 'Hyunjin', 'Han_(rapper)',
    'Felix_(rapper)', 'Seungmin_(singer)', 'I.N',
  
    // Aespa Members
    'Karina_(singer)', 'Giselle_(singer)', 'Winter_(singer)', 'Ningning',
  
    // NewJeans Members
    'Minji_(singer)', 'Hanni', 'Danielle_(singer)', 'Haerin', 'Hyein',
  
    // Legacy Artists/Groups
    'Girls\'_Generation', 'Big_Bang_(South_Korean_band)', 'Shinee', '2NE1', 'Wonder_Girls',
    'Super_Junior', 'TVXQ', 'f(x)_(group)', 'Miss_A', 'Sistar',
    'Beast_(South_Korean_band)', 'Highlight_(group)', '4Minute', '2PM', 'Infinite_(group)',
    'Apink', 'B.A.P_(South_Korean_band)', 'Block_B', 'Girl\'s_Day', 'AOA_(group)'
  ];
  
  async function fetchWikipediaData(title) {
    try {
      const response = await axios.get(WIKIPEDIA_API, {
        params: {
          action: 'query',
          format: 'json',
          titles: title,
          prop: 'pageimages',
          pithumbsize: 500,
          origin: '*'
        }
      });
      const pages = response.data.query.pages;
      return Object.values(pages)[0];
    } catch (error) {
      console.error(`Error fetching data for ${title}:`, error.message);
      return null;
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
    const categoryId = await getCategoryId('K-pop');
    if (!categoryId) {
      console.error('Could not find or create the K-pop category.');
      return;
    }
  
    await clearExistingItems(categoryId);
  
    let totalInserted = 0;
  
    for (const artist of kpopArtists) {
      const artistInfo = await fetchWikipediaData(artist);
      if (artistInfo && artistInfo.thumbnail) {
        const imageUrl = artistInfo.thumbnail.source;
        const artistName = artistInfo.title.replace(/_/g, ' ').replace(/\([^)]+\)/g, '').trim();
        
        const question = {
          question: "Who is this K-pop artist or group?",
          answer: [artistName],
          image_url: imageUrl
        };
  
        if (await insertItem(categoryId, question)) {
          totalInserted++;
          console.log(`Inserted question for: ${artistName}`);
        }
      } else {
        console.log(`Skipped ${artist}: No image found`);
      }
  
      // Respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  
    console.log(`Finished populating database with ${totalInserted} K-pop items.`);
  }
  
  populateDatabase().catch(console.error);