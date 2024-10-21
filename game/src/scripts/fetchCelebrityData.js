const axios = require('axios');
const { supabase } = require('../services/supabaseClient');

const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';

// Extended list of celebrities
const celebrities = [
    // Actors
    'Tom_Hanks', 'Meryl_Streep', 'Leonardo_DiCaprio', 'Jennifer_Lawrence', 'Brad_Pitt',
    'Angelina_Jolie', 'Denzel_Washington', 'Scarlett_Johansson', 'Robert_Downey_Jr.', 'Cate_Blanchett',
    'Johnny_Depp', 'Viola_Davis', 'Will_Smith', 'Emma_Stone', 'Ryan_Gosling',
    'Charlize_Theron', 'Christian_Bale', 'Natalie_Portman', 'Tom_Cruise', 'Nicole_Kidman',
    'Joaquin_Phoenix', 'Margot_Robbie', 'Hugh_Jackman', 'Anne_Hathaway', 'Matt_Damon',
    'Julia_Roberts', 'George_Clooney', 'Meryl_Streep', 'Daniel_Day-Lewis', 'Kate_Winslet',
    'Morgan_Freeman', 'Helen_Mirren', 'Anthony_Hopkins', 'Judi_Dench', 'Al_Pacino',
    'Samuel_L._Jackson', 'Javier_Bardem', 'Penélope_Cruz', 'Christoph_Waltz', 'Marion_Cotillard',
    'Matthew_McConaughey', 'Lupita_Nyong\'o', 'Mahershala_Ali', 'Olivia_Colman', 'Gary_Oldman',
    'Frances_McDormand', 'Timothée_Chalamet', 'Saoirse_Ronan', 'Adam_Driver', 'Emma_Thompson',
  
    // TV Actors
    'Bryan_Cranston', 'Jennifer_Aniston', 'Kit_Harington', 'Emilia_Clarke', 'Jim_Parsons',
    'Kaley_Cuoco', 'Sterling_K._Brown', 'Elisabeth_Moss', 'Peter_Dinklage', 'Millie_Bobby_Brown',
    'Steve_Carell', 'Jon_Hamm', 'Claire_Danes', 'Hugh_Laurie', 'Kerry_Washington',
    'James_Gandolfini', 'Julia_Louis-Dreyfus', 'Aaron_Paul', 'Sarah_Paulson', 'Bob_Odenkirk',
    'Tatiana_Maslany', 'Benedict_Cumberbatch', 'Zendaya', 'Jason_Sudeikis', 'Phoebe_Waller-Bridge',
  
    // Directors
    'Steven_Spielberg', 'Martin_Scorsese', 'Quentin_Tarantino', 'Christopher_Nolan', 'Ava_DuVernay',
    'Spike_Lee', 'Kathryn_Bigelow', 'Wes_Anderson', 'Coen_brothers', 'James_Cameron',
    'Greta_Gerwig', 'Bong_Joon-ho', 'Guillermo_del_Toro', 'Denis_Villeneuve', 'Taika_Waititi',
  
    // Musicians (Various Genres)
    'Beyoncé', 'Ed_Sheeran', 'Taylor_Swift', 'Drake_(musician)', 'Adele',
    'Bruno_Mars', 'Rihanna', 'Justin_Bieber', 'Lady_Gaga', 'Eminem',
    'Ariana_Grande', 'Kanye_West', 'Billie_Eilish', 'The_Weeknd', 'Dua_Lipa',
    'Shawn_Mendes', 'Doja_Cat', 'Post_Malone', 'Cardi_B', 'Harry_Styles',
    'Jay-Z', 'Katy_Perry', 'Kendrick_Lamar', 'Coldplay', 'Maroon_5',
    'Imagine_Dragons', 'Pink_(singer)', 'John_Legend', 'Alicia_Keys', 'Sam_Smith',
    'Demi_Lovato', 'Selena_Gomez', 'Justin_Timberlake', 'Shakira', 'Sia_(musician)',
    'Ellie_Goulding', 'Lorde', 'Lana_Del_Rey', 'Twenty_One_Pilots', 'The_Chainsmokers',
    'Camila_Cabello', 'Charlie_Puth', 'Halsey', 'Lauv', 'Marshmello',
    'Calvin_Harris', 'David_Guetta', 'Martin_Garrix', 'Zedd', 'Avicii',
  
    // Legacy Musicians
    'Michael_Jackson', 'Madonna_(entertainer)', 'Elvis_Presley', 'David_Bowie', 'Prince_(musician)',
    'Whitney_Houston', 'Freddie_Mercury', 'Bob_Dylan', 'Elton_John', 'Stevie_Wonder',
    'The_Beatles', 'Rolling_Stones', 'Led_Zeppelin', 'Pink_Floyd', 'Queen_(band)',
    'U2', 'Nirvana_(band)', 'Guns_N\'_Roses', 'Metallica', 'Aerosmith',
    'Bruce_Springsteen', 'Bob_Marley', 'Aretha_Franklin', 'Marvin_Gaye', 'Frank_Sinatra',
    'Cher', 'Tina_Turner', 'Diana_Ross', 'Barbra_Streisand', 'Céline_Dion',
  
    // Athletes
    'Cristiano_Ronaldo', 'Lionel_Messi', 'LeBron_James', 'Serena_Williams', 'Usain_Bolt',
    'Michael_Phelps', 'Roger_Federer', 'Simone_Biles', 'Tom_Brady', 'Naomi_Osaka',
    'Neymar', 'Virat_Kohli', 'Rafael_Nadal', 'Megan_Rapinoe', 'Kylian_Mbappé',
    'Michael_Jordan', 'Tiger_Woods', 'Pelé', 'Muhammad_Ali', 'Wayne_Gretzky',
    'Martina_Navratilova', 'Babe_Ruth', 'Kareem_Abdul-Jabbar', 'Simone_Biles', 'Mia_Hamm',
    'Novak_Djokovic', 'Lindsey_Vonn', 'Shaun_White', 'Usain_Bolt', 'Allyson_Felix',
  
    // TV Personalities
    'Oprah_Winfrey', 'Ellen_DeGeneres', 'Jimmy_Fallon', 'Kim_Kardashian', 'Ryan_Seacrest',
    'Simon_Cowell', 'Jimmy_Kimmel', 'Stephen_Colbert', 'Trevor_Noah', 'James_Corden',
    'Anderson_Cooper', 'Rachel_Maddow', 'Tyra_Banks', 'RuPaul', 'Gordon_Ramsay',
    'Anthony_Bourdain', 'Guy_Fieri', 'Padma_Lakshmi', 'Ryan_Reynolds', 'Dwayne_Johnson',
  
    // Models
    'Gigi_Hadid', 'Kendall_Jenner', 'Cara_Delevingne', 'Tyra_Banks', 'Naomi_Campbell',
    'Karlie_Kloss', 'Bella_Hadid', 'Chrissy_Teigen', 'Ashley_Graham', 'Adriana_Lima',
    'Heidi_Klum', 'Kate_Moss', 'Cindy_Crawford', 'Gisele_Bündchen', 'Claudia_Schiffer',
  
    // Comedians
    'Kevin_Hart', 'Amy_Schumer', 'Dave_Chappelle', 'Tiffany_Haddish', 'John_Mulaney',
    'Ali_Wong', 'Ricky_Gervais', 'Aziz_Ansari', 'Melissa_McCarthy', 'Bill_Burr',
    'Jerry_Seinfeld', 'Chris_Rock', 'Eddie_Murphy', 'Robin_Williams', 'Steve_Martin',
    'Tina_Fey', 'Amy_Poehler', 'Conan_O\'Brien', 'Seth_Meyers', 'John_Oliver',
  
    // Business/Tech Leaders
    'Elon_Musk', 'Mark_Zuckerberg', 'Jeff_Bezos', 'Bill_Gates', 'Tim_Cook',
    'Sheryl_Sandberg', 'Richard_Branson', 'Warren_Buffett', 'Satya_Nadella', 'Sundar_Pichai',
    'Jack_Ma', 'Oprah_Winfrey', 'Steve_Jobs', 'Larry_Page', 'Sergey_Brin',
    'Jack_Dorsey', 'Reed_Hastings', 'Susan_Wojcicki', 'Marissa_Mayer', 'Indra_Nooyi',
  
    // Political Figures
    'Barack_Obama', 'Angela_Merkel', 'Emmanuel_Macron', 'Justin_Trudeau', 'Jacinda_Ardern',
    'Alexandria_Ocasio-Cortez', 'Kamala_Harris', 'Bernie_Sanders', 'Greta_Thunberg', 'Malala_Yousafzai',
    'Nelson_Mandela', 'Mahatma_Gandhi', 'Martin_Luther_King_Jr.', 'Winston_Churchill', 'Margaret_Thatcher',
    'John_F._Kennedy', 'Abraham_Lincoln', 'Franklin_D._Roosevelt', 'Dalai_Lama', 'Mikhail_Gorbachev',
  
    // Royalty
    'Queen_Elizabeth_II', 'Prince_William,_Duke_of_Cambridge', 'Catherine,_Duchess_of_Cambridge', 'Prince_Harry,_Duke_of_Sussex', 'Meghan,_Duchess_of_Sussex',
    'Prince_Charles', 'Princess_Diana', 'Grace_Kelly', 'King_George_VI', 'Queen_Victoria',
  
    // Chefs/Food Personalities
    'Gordon_Ramsay', 'Jamie_Oliver', 'Anthony_Bourdain', 'Ina_Garten', 'Nigella_Lawson',
    'Alton_Brown', 'Emeril_Lagasse', 'Julia_Child', 'Wolfgang_Puck', 'Bobby_Flay',
  
    // Authors
    'J._K._Rowling', 'Stephen_King', 'George_R._R._Martin', 'Margaret_Atwood', 'Haruki_Murakami',
    'Dan_Brown', 'John_Grisham', 'Nora_Roberts', 'James_Patterson', 'Agatha_Christie',
    'Ernest_Hemingway', 'Virginia_Woolf', 'F._Scott_Fitzgerald', 'Jane_Austen', 'William_Shakespeare',
  
    // Fashion Designers
    'Donatella_Versace', 'Giorgio_Armani', 'Vera_Wang', 'Ralph_Lauren', 'Coco_Chanel',
    'Christian_Dior', 'Yves_Saint_Laurent', 'Karl_Lagerfeld', 'Tom_Ford', 'Marc_Jacobs',
  
    // Influencers/YouTubers
    'PewDiePie', 'MrBeast', 'Jenna_Marbles', 'Logan_Paul', 'Liza_Koshy',
    'Markiplier', 'Jeffree_Star', 'James_Charles', 'Lilly_Singh', 'Casey_Neistat',
  
    // Misc. Entertainers
    'RuPaul', 'Neil_Patrick_Harris', 'Lin-Manuel_Miranda', 'Hugh_Jackman', 'John_Legend',
    'Viola_Davis', 'Meryl_Streep', 'Beyoncé', 'Lady_Gaga', 'Jennifer_Lopez',
  
    // International Stars
    'Shah_Rukh_Khan', 'Priyanka_Chopra', 'Jackie_Chan', 'Deepika_Padukone', 'Penélope_Cruz',
    'Lupita_Nyong\'o', 'Javier_Bardem', 'Aishwarya_Rai_Bachchan', 'Gael_García_Bernal', 'Marion_Cotillard',
    'Amitabh_Bachchan', 'Aamir_Khan', 'Gong_Li', 'Chow_Yun-fat', 'Maggie_Cheung',
    'Toshiro_Mifune', 'Akira_Kurosawa', 'Pedro_Almodóvar', 'Sophia_Loren', 'Marcello_Mastroianni',
  
    // Legacy Figures
    'Marilyn_Monroe', 'Audrey_Hepburn', 'Charlie_Chaplin', 'Muhammad_Ali', 'Princess_Diana',
    'Albert_Einstein', 'Leonardo_da_Vinci', 'Marie_Curie', 'Vincent_van_Gogh', 'Pablo_Picasso',
    'Frida_Kahlo', 'Andy_Warhol', 'Walt_Disney', 'Jim_Henson', 'Stan_Lee',
  
    // Additional Contemporary Figures
    'Keanu_Reeves', 'Chris_Hemsworth', 'Tom_Holland_(actor)', 'Robert_Pattinson', 'Timothée_Chalamet',
    'Margot_Robbie', 'Florence_Pugh', 'Anya_Taylor-Joy', 'Awkwafina', 'Constance_Wu',
    'Henry_Golding', 'John_Boyega', 'Daisy_Ridley', 'Oscar_Isaac', 'Pedro_Pascal',
    'Phoebe_Waller-Bridge', 'Donald_Glover', 'Issa_Rae', 'Rami_Malek', 'Chadwick_Boseman',
    'Brie_Larson', 'Gal_Gadot', 'Chris_Pratt', 'Dwayne_Johnson', 'Emily_Blunt',
    'John_Krasinski', 'Elisabeth_Moss', 'Sterling_K._Brown', 'Milo_Ventimiglia', 'Mandy_Moore',
    'Kit_Harington', 'Emilia_Clarke', 'Sophie_Turner', 'Maisie_Williams', 'Nikolaj_Coster-Waldau',
    'Millie_Bobby_Brown', 'Finn_Wolfhard', 'Noah_Schnapp', 'Gaten_Matarazzo', 'Caleb_McLaughlin',
    'Winona_Ryder', 'David_Harbour', 'Joe_Keery', 'Sadie_Sink', 'Natalia_Dyer', 'Charlie_Heaton',
  'Evan_Rachel_Wood', 'Thandiwe_Newton', 'Jeffrey_Wright', 'Ed_Harris', 'Tessa_Thompson',
  'Anthony_Mackie', 'Sebastian_Stan', 'Elizabeth_Olsen', 'Paul_Bettany', 'Tom_Hiddleston',
  'Benedict_Cumberbatch', 'Martin_Freeman', 'Andrew_Scott', 'Olivia_Colman', 'Claire_Foy',
  'Matt_Smith', 'Gillian_Anderson', 'Helena_Bonham_Carter', 'Vanessa_Kirby', 'Josh_O\'Connor',
  'Emma_Corrin', 'Jason_Bateman', 'Laura_Linney', 'Julia_Garner', 'Jodie_Comer',
  'Sandra_Oh', 'Sarah_Paulson', 'Evan_Peters', 'Jessica_Lange', 'Angela_Bassett',
  'Billy_Porter', 'Michaela_Coel', 'Olivia_Wilde', 'Lena_Waithe', 'Mindy_Kaling',
  'Kumail_Nanjiani', 'Simu_Liu', 'Steven_Yeun', 'Ali_Wong', 'Randall_Park',
  'John_Cho', 'Ken_Jeong', 'Lana_Condor', 'Ross_Butler', 'Charles_Melton',
  'Manny_Jacinto', 'Bowen_Yang', 'Daniel_Dae_Kim', 'Gemma_Chan', 'Lulu_Wang',
  'Chloé_Zhao', 'Bong_Joon-ho', 'Parasite_(2019_film)', 'Youn_Yuh-jung', 'Lee_Isaac_Chung',
  'Minari_(film)', 'Dev_Patel', 'Riz_Ahmed', 'Priyanka_Chopra', 'Deepika_Padukone',
  'Ranveer_Singh', 'Alia_Bhatt', 'Ranbir_Kapoor', 'Anushka_Sharma', 'Virat_Kohli',
  'Shah_Rukh_Khan', 'Aamir_Khan', 'Salman_Khan', 'Akshay_Kumar', 'Hrithik_Roshan',
  'Katrina_Kaif', 'Kareena_Kapoor', 'Aishwarya_Rai_Bachchan', 'Amitabh_Bachchan', 'Rajinikanth',
  'Mohanlal', 'Mammootty', 'Vijay_(actor)', 'Ajith_Kumar', 'Nayanthara',
  'Prabhas', 'Mahesh_Babu', 'Allu_Arjun', 'Ram_Charan', 'Jr_NTR',
  'Song_Joong-ki', 'Song_Hye-kyo', 'Hyun_Bin', 'Son_Ye-jin', 'Park_Seo-joon',
  'IU_(singer)', 'Bae_Suzy', 'Lee_Min-ho_(actor)', 'Gong_Yoo', 'Kim_Soo-hyun',
  'Jun_Ji-hyun', 'Park_Bo-gum', 'Yoo_Ah-in', 'Jeon_Do-yeon', 'Choi_Min-sik',
  'BTS_(band)', 'Blackpink', 'Twice_(group)', 'EXO_(band)', 'Red_Velvet_(group)',
  'NCT_(band)', 'Seventeen_(South_Korean_band)', 'Stray_Kids', 'Itzy', 'Aespa',
  'RM_(rapper)', 'Jin_(singer)', 'Suga_(rapper)', 'J-Hope', 'Jimin_(singer)',
  'V_(singer)', 'Jungkook', 'Lisa_(rapper)', 'Jennie_(singer)', 'Rosé_(singer)',
  'Jisoo_(singer)', 'Nayeon', 'Jeongyeon', 'Momo_(singer)', 'Sana_(singer)',
  'Jihyo', 'Mina_(singer)', 'Dahyun', 'Chaeyoung', 'Tzuyu',
  'Baekhyun', 'Chanyeol', 'Kai_(singer)', 'Sehun', 'Xiumin',
  'Irene_(singer)', 'Seulgi', 'Wendy_(singer)', 'Joy_(singer)', 'Yeri',
  'Taeyong_(singer)', 'Mark_Lee_(singer)', 'Jaehyun_(singer)', 'Doyoung_(singer)', 'Johnny_(singer)',
  'S.Coups', 'Woozi_(singer)', 'Mingyu_(singer)', 'Hoshi_(singer)', 'Vernon_(singer)',
  'Bang_Chan', 'Han_(rapper)', 'Felix_(rapper)', 'Lee_Know', 'Hyunjin',
  'Yeji', 'Lia_(singer)', 'Ryujin', 'Chaeryeong', 'Yuna_(singer,_born_2003)',
  'Karina_(singer)', 'Giselle_(singer)', 'Winter_(singer)', 'Ningning', 'NewJeans',
  'Le_Sserafim', '(G)I-dle', 'Itzy', 'Stray_Kids', 'Ateez',
  'Tomorrow_X_Together', 'Enhypen', 'The_Boyz_(South_Korean_band)', 'Monsta_X', 'Seventeen_(South_Korean_band)',
  'Got7', 'Day6', 'iKon', 'Winner_(band)', 'BTOB',
  'Mamamoo', 'Apink', 'Oh_My_Girl', 'Brave_Girls', 'Momoland',
  'PSY', 'Rain_(entertainer)', 'BoA_(singer)', 'Lee_Hyori', 'Jessi_(musician)',
  'Jay_Park', 'Zico_(rapper)', 'CL_(singer)', 'HyunA', 'Dawn_(singer)',
  'Taemin', 'Taeyeon', 'Baekhyun', 'Kai_(singer)', 'Chungha',
  'Sunmi', 'Hwasa', 'Solar_(singer)', 'Moonbyul', 'Wheein',
  'Soyeon_(rapper)', 'Miyeon', 'Minnie_(singer)', 'Yuqi', 'Shuhua',
  'Kang_Daniel', 'Ong_Seong-wu', 'Kim_Jae-hwan', 'Ha_Sung-woon', 'Park_Ji-hoon',
  'Lee_Dae-hwi', 'Park_Woo-jin', 'Bae_Jin-young', 'Lai_Kuan-lin', 'Yoon_Ji-sung',
  'Wanna_One', 'I.O.I', 'X1_(band)', 'IZ*ONE', 'Produce_101',
  'Girls\'_Generation', 'Super_Junior', 'SHINee', 'f(x)_(group)', '2NE1',
  'Wonder_Girls', 'TVXQ', 'Big_Bang_(South_Korean_band)', '2PM', 'Miss_A',
  'Sistar', 'T-ara', 'Kara_(South_Korean_group)', 'After_School_(group)', 'B.A.P_(South_Korean_band)',
  'Block_B', 'Infinite_(group)', 'Beast_(South_Korean_band)', '4Minute', 'Girl\'s_Day',
  'AOA_(group)', 'Exid', 'Gfriend', 'Lovelyz', 'Weki_Meki',
  'Cosmic_Girls', 'Fromis_9', 'Iz*One', 'Loona_(group)', 'Dreamcatcher_(group)',
  'Jackie_Chan', 'Jet_Li', 'Donnie_Yen', 'Chow_Yun-fat', 'Michelle_Yeoh',
  'Zhang_Ziyi', 'Gong_Li', 'Maggie_Cheung', 'Tony_Leung_Chiu-wai', 'Andy_Lau',
  'Stephen_Chow', 'Takeshi_Kaneshiro', 'Jay_Chou', 'Kris_Wu', 'Lu_Han',
  'Angelababy', 'Fan_Bingbing', 'Yang_Mi', 'Zhao_Wei', 'Liu_Yifei',
  'Donnie_Yen', 'Tony_Jaa', 'Iko_Uwais', 'Joe_Taslim', 'Yayan_Ruhian',
  'John_Woo', 'Ang_Lee', 'Wong_Kar-wai', 'Zhang_Yimou', 'Tsui_Hark',
  'Hayao_Miyazaki', 'Akira_Kurosawa', 'Takeshi_Kitano', 'Hirokazu_Koreeda', 'Sion_Sono',
  'Takashi_Miike', 'Satoshi_Kon', 'Mamoru_Hosoda', 'Makoto_Shinkai', 'Hideaki_Anno',
  'Toshiro_Mifune', 'Ken_Watanabe', 'Takeshi_Kitano', 'Yōjirō_Takita', 'Kōji_Yakusho',
  'Tadanobu_Asano', 'Hiroyuki_Sanada', 'Rinko_Kikuchi', 'Masami_Nagasawa', 'Aoi_Yu',
  'Haruka_Ayase', 'Shun_Oguri', 'Masaki_Suda', 'Kento_Yamazaki', 'Ryunosuke_Kamiki',
  'Yui_Aragaki', 'Satomi_Ishihara', 'Erika_Toda', 'Kasumi_Arimura', 'Suzu_Hirose',
  'Arashi', 'SMAP', 'AKB48', 'Nogizaka46', 'Keyakizaka46',
  'Perfume_(Japanese_band)', 'Babymetal', 'One_OK_Rock', 'L\'Arc-en-Ciel', 'X_Japan',
  'Utada_Hikaru', 'Ayumi_Hamasaki', 'Namie_Amuro', 'Koda_Kumi', 'Kyary_Pamyu_Pamyu',
  'Exile_(Japanese_band)', 'Sandaime_J_Soul_Brothers', 'Generations_from_Exile_Tribe', 'E-girls', 'Da_Pump',
  'Anirudh_Ravichander', 'A._R._Rahman', 'Ilaiyaraaja', 'Shankar–Ehsaan–Loy', 'Amit_Trivedi',
  'Arijit_Singh', 'Shreya_Ghoshal', 'Sonu_Nigam', 'Neha_Kakkar', 'Atif_Aslam',
  'Badshah_(rapper)', 'Yo_Yo_Honey_Singh', 'Guru_Randhawa', 'Nucleya', 'Divine_(rapper)',
  'Diljit_Dosanjh', 'Sidhu_Moose_Wala', 'Harrdy_Sandhu', 'Parmish_Verma', 'Mankirt_Aulakh',
  'Gurdas_Maan', 'Daler_Mehndi', 'Mika_Singh', 'Jazzy_B', 'Babbu_Maan',
  'Lata_Mangeshkar', 'Asha_Bhosle', 'Kishore_Kumar', 'Mohammed_Rafi', 'S._P._Balasubrahmanyam',
  'K._S._Chithra', 'Alka_Yagnik', 'Kumar_Sanu', 'Udit_Narayan', 'Sunidhi_Chauhan',
  'Mohit_Chauhan', 'Vishal_Dadlani', 'Shekhar_Ravjiani', 'Pritam', 'Amit_Trivedi',
  'Shankar_Mahadevan', 'Ehsaan_Noorani', 'Loy_Mendonsa', 'Salim-Sulaiman', 'Sajid–Wajid',
  'Himesh_Reshammiya', 'Mithoon', 'Sachin–Jigar', 'Vishal–Shekhar', 'Ajay-Atul',
  'S._S._Rajamouli', 'Mani_Ratnam', 'Shankar_(director)', 'A._R._Murugadoss', 'Gautham_Vasudev_Menon',
  'Anurag_Kashyap', 'Imtiaz_Ali', 'Zoya_Akhtar', 'Sanjay_Leela_Bhansali', 'Karan_Johar',
  'Rohit_Shetty', 'Rajkumar_Hirani', 'Farhan_Akhtar', 'Vishal_Bhardwaj', 'Anurag_Basu',
  'Anubhav_Sinha', 'Hansal_Mehta', 'Neeraj_Ghaywan', 'Vikramaditya_Motwane', 'Shoojit_Sircar',
  'Sriram_Raghavan', 'Dibakar_Banerjee', 'Kabir_Khan', 'Meghna_Gulzar', 'Gauri_Shinde',
  'Konkona_Sen_Sharma', 'Nandita_Das', 'Aparna_Sen', 'Deepa_Mehta', 'Mira_Nair',
  'Ashutosh_Gowariker', 'Rakeysh_Omprakash_Mehra', 'Nitesh_Tiwari', 'Amit_Sharma', 'Amar_Kaushik',
  'Vicky_Kaushal', 'Ayushmann_Khurrana', 'Rajkummar_Rao', 'Ranveer_Singh', 'Ranbir_Kapoor',
  'Varun_Dhawan', 'Sidharth_Malhotra', 'Tiger_Shroff', 'Kartik_Aaryan', 'Sushant_Singh_Rajput',
  'Irrfan_Khan', 'Nawazuddin_Siddiqui', 'Manoj_Bajpayee', 'Pankaj_Tripathi', 'Kay_Kay_Menon', ]

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
  const categoryId = await getCategoryId('Celebrities');
  if (!categoryId) {
    console.error('Could not find or create the Celebrities category.');
    return;
  }

  await clearExistingItems(categoryId);

  let totalInserted = 0;

  for (const celebrity of celebrities) {
    const celebrityInfo = await fetchWikipediaData(celebrity);
    if (celebrityInfo && celebrityInfo.thumbnail) {
      const imageUrl = celebrityInfo.thumbnail.source;
      const celebrityName = celebrityInfo.title.replace(/_/g, ' ').replace(/\([^)]+\)/g, '').trim();
      
      const question = {
        question: "Who is this celebrity?",
        answer: [celebrityName],
        image_url: imageUrl
      };

      if (await insertItem(categoryId, question)) {
        totalInserted++;
        console.log(`Inserted question for: ${celebrityName}`);
      }
    } else {
      console.log(`Skipped ${celebrity}: No image found`);
    }

    // Respect API rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`Finished populating database with ${totalInserted} celebrity items.`);
}

populateDatabase().catch(console.error);