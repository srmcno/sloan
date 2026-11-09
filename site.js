/* Site settings. Everything that differs between the family archives lives here and in the data files;
   index.html, app.js and the shared modules are identical on both sites. */
window.SITE = {
  id: 'sloan',
  storage: 'sloan-family',
  title: 'Family Roots',
  data: 'content',                        // data.json + tree.json, converted by adapter.js
  rootName: 'You',
  rootPossessive: 'Our',
  text: {
    ancestryLink: '<a href="ancestry.html" aria-label="Ancestry and DNA"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 3c0 4.5 8 4.5 8 9s-8 4.5-8 9M16 3c0 4.5-8 4.5-8 9s8 4.5 8 9M9.6 6.5h4.8M9.6 17.5h4.8"/></svg><span class="al-long">Ancestry &amp;&nbsp;</span>DNA</a>',
    otherArchive: '<a href="https://srmcno.github.io/family/">Moffitt &amp; Thompson family archive</a>',
    brandSmall: 'Moffitt · Livesay · Sandridge · Whitfield',
    heroTitle: 'Family history and stories.',
    heroIntro: 'From the Choctaw Nation to Quaker North Carolina, and from Illinois to Pearland, Texas, explore the stories, records and photographs of our ancestors. Open any story or person to read more, see the original records, and check the sources.',
    heroNote: 'Relationships are shown from the family member at the center of this tree. Explore both sides of the family.',
    gpIntro: 'Explore the family lines and the records that connect generations.',
    placesPath: 'From the Choctaw Nation and McCurtain County to Texas, Illinois, Arkansas, Mississippi, Kentucky, the Carolinas, Virginia and Connecticut.',
    momBlurb: 'The Livesays from Illinois to Houston and Pearland, Texas, and the Sandridge, Whitfield, Merry and Box families of McCurtain County, Oklahoma, with earlier roots in Mississippi, Alabama, Tennessee, Virginia and Connecticut.',
    momNames: 'Livesay · Walker · Phillips · Sandridge · Whitfield · Merry · Box · Logan',
    dadBlurb: 'Choctaw Nation, Arkansas, Kentucky, North Carolina and beyond.',
    dadNames: 'Moffitt · Thompson · Hulsey · Smith',
    rootGroup: 'Our generation',
    aboutIntro: 'This family history follows the records. Each story is marked with how well the records support it, and the sources are listed with every story.',
    aboutCompare: 'Relationships are shown from the center of this tree. Living people are represented by their family roles.',
    fixesTitle: 'Corrections and research notes',
    sources: 'Dawes enrollment cards and allotment files; 1896 Choctaw census; U.S. censuses 1880–1940; WPA Indian-Pioneer interviews #7392 and #7418 (1937); WWI and WWII draft registrations; U.S. Navy muster rolls; Colonial and State Records of North Carolina; Randolph County wills; Hinshaw’s Encyclopedia of American Quaker Genealogy; Indiana Adjutant General’s Report; Kappler’s Indian Affairs: Laws and Treaties; newspaper obituaries.',
    credits: 'Family photographs come from the Moffitt Family Tree on Ancestry. Some have been restored or colorized with AI; colors and reconstructed details are interpretations. The originals are available for comparison. Marmon Wasp photo by OctaviaCombi and Alamance plaque photo by Hallcp, CC BY-SA 4.0 via Wikimedia Commons; USS Chief photo, U.S. Navy (NH 96996); 1919 code letter, U.S. Army. Hugo (1910 street view and 1912 Frisco shops postcard), Butler County, Allen County and Gibson County photographs: Wikimedia Commons, public domain. Mountain View courthouse photo by Sgerbic, CC BY-SA 4.0, via Wikimedia Commons.'
  },
  lineBlurbs: ['North Carolina Quaker country, Arkansas, Kentucky and northeast Texas', 'The Choctaw Nation and Hugo, Oklahoma; Arkansas, Tennessee and Indiana', 'Illinois to Houston and Pearland, Texas; the Phillips family of Nacogdoches', 'Broken Bow, Glover and Wheelock in McCurtain County, Oklahoma'],
  heroExtras: [
    {s:'img/p/larry_alfreda_sandridge_original.png',cap:'Larry and Alfreda Sandridge, 50th anniversary portrait, 2008',story:'sandridge-broken-bow-research-lead'},
    {s:'img/p/audrey_nelson_sandridge_original.jpg',cap:'Audrey Inez Nelson Sandridge; original portrait contributed by JEF',story:'audrey-nelson-sandridge'},
    {s:'img/p/larry_sandridge_young_adult_original.jpg',cap:'Portrait attributed to Larry Sandridge by FamilySearch contributor JNR12; date unknown',story:'sandridge-broken-bow-research-lead'}
  ],
  heroKeys: ['henry_hannah', 'gilbert_parsis', 'daniel_oneal', 'vashti_framed', 'joel_ira', 'mary_tinsley', 'rebecca_graves', 'parsis_portrait', 'william_junior', 'faye_moffitt'],
  featured: [],
  topics: {
    choctaw: { label: 'Choctaw Nation', copy: 'Enrollment, allotments, courts and family life in the Choctaw Nation.', tag: 'choctaw',
      journey: ['fort-towson-post', 'removal', 'mig-pisachubbe-first-exiles', 'mig-doaksville-1833-removal', 'vincent', 'book2-doak-tims-contracts-1838', 'doaksville-constitution-1860', 'edward', 'joseph', 'betsy', 'simon', 'edith-thompson-slaton'] },
    military: { label: 'Military service', copy: 'From the Revolution and the Civil War to the World Wars and the Navy.', tag: 'military',
      journey: ['moff-after-alamance', 'wm-after-alamance', 'fort-towson-post', 'daniel', 'hulsey-42nd-perryville-stones-river', 'watie-surrender-doaksville', 'edmond', 'gwhulsey', 'jwm', 'ard19-leyte'] },
    quaker: { label: 'Quaker roots', copy: 'Meetings, migrations and the Quaker families of the Carolinas and beyond.', tag: 'quaker',
      journey: ['wt2-henry-janet-croasdale', 'wt-richard-margery-browne', 'wt-dorothy-butler-gaunt', 'wt-john-bridget-cowgill', 'wt2-william-croasdale', 'anthony', 'rogers', 'marydavies', 'cane-creek-1763', 'moff-after-alamance', 'william', 'aden'] },
    notable: { label: 'Notable lives', copy: 'Leaders, witnesses and unusual turns in the family’s history.', tag: 'notable' }
  },
  regions: [
    { id: 'mccurtain', name: 'Glover & McCurtain County', label: 'Oklahoma', terms: ['glover', 'mccurtain', 'idabel', 'broken bow', 'golden', 'wheelock', 'valliant', 'redland'], description: 'The Merry, Whitfield, Sandridge and Box families of southeastern Oklahoma, from Dawes enrollment to the Golden post office.' },
    { id: 'houston', name: 'Houston & Pearland', label: 'Texas', terms: ['pearland', 'houston', 'harris county', 'alvin', 'brazoria', 'nacogdoches'], description: 'The Livesay family from Floyd Livesay’s Pearland grocery to Lester Livesay Jr.’s cattle ranch.', archive: 'harris-county-courthouse' },
    { id: 'illinois', name: 'Washington County, Illinois', label: 'Illinois', terms: ['illinois', 'beaucoup', 'washington county', 'richview'], description: 'The Livesay and Walker families of the Beaucoup settlement before the move to Texas.' },
    { id: 'choctaw', name: 'Hugo & the Choctaw Nation', label: 'Oklahoma', terms: ['choctaw', 'hugo', 'jeter', 'doaksville', 'fort towson', 'kiamitia', 'cedar county', 'speer', 'sawyer', 'boswell', 'goodland', 'grant'], description: 'Thompson, Tims and Pisachubbe families in the Choctaw Nation, and the Moffitts, Smiths and Hulseys who settled around Hugo.', archive: 'hugo_1910' },
    { id: 'arkansas', name: 'Arkansas hill country', label: 'Arkansas', terms: ['arkansas', 'stone county', 'mountain view', 'montgomery county', 'garland', 'hot springs', 'story, ark'], description: 'The Moffitt and Hulsey families in Stone, Montgomery and Garland counties.', archive: 'mountainview_courthouse' },
    { id: 'texas', name: 'Northeast Texas', label: 'Texas', terms: ['paris, texas', 'lamar', 'franklin county', 'red river county', 'texas'], description: 'Paris, Lamar County and the farm country across the Red River from Hugo.' },
    { id: 'kentucky', name: 'Kentucky', label: 'Kentucky', terms: ['kentucky', 'allen county', 'butler county'], description: 'The Smith and Satterfield families of Allen and Butler counties.', archive: 'allen_courthouse' },
    { id: 'indiana', name: 'Indiana', label: 'Indiana', terms: ['indiana', 'gibson county'], description: 'Stevenson and O’Neal families in Gibson County.', archive: 'gibson_courthouse' },
    { id: 'tennessee', name: 'Tennessee & Alabama', label: 'The South', terms: ['tennessee', 'pulaski', 'giles', 'williamson county', 'maury', 'alabama', 'etowah', 'st clair'], description: 'Stevenson, Shackleford and Newton families before the move west, and the Livesays and Fitzgeralds of Williamson and Maury counties.' },
    { id: 'mississippi', name: 'Mississippi & west Alabama', label: 'Deep South', terms: ['mississippi', 'tippah', 'benton county, miss', 'burnsville', 'tishomingo', 'greene county, ala', 'eutaw'], description: 'The Whitfield and Box families of northeast Mississippi, and the Logans and Wedgworths of Greene County, Alabama.' },
    { id: 'southcarolina', name: 'South Carolina', label: 'Upcountry', terms: ['south carolina', 'abbeville', 'long cane'], description: 'The Logans of Long Cane and the Rev. Robert White on Mom’s side, and the Newtons of Pickens District on Dad’s.' },
    { id: 'chesapeake', name: 'Virginia & Maryland', label: 'Colonial roots', terms: ['virginia', 'sussex county, va', 'albemarle', 'york county', 'pittsylvania', 'new kent', 'spotsylvania', 'maryland', 'somerset county', 'baltimore county'], description: 'On Mom’s side, the Stacy, Harrison and Holloway families of Sussex County, the early Livesays and the Beauchamps of Somerset County; on Dad’s, the Tims, Johnsons, Coles and Garretts.' },
    { id: 'delaware', name: 'Pennsylvania & New Jersey', label: 'Delaware Valley', terms: ['pennsylvania', 'new jersey', 'burlington', 'chester county', 'bucks county', 'philadelphia'], description: 'The Quaker Nordyke, Cowgill, Croasdale and Sample families of the Delaware Valley, before North Carolina.' },
    { id: 'connecticut', name: 'Connecticut', label: 'New England', terms: ['connecticut', 'hartford', 'winchester', 'hartland', 'litchfield'], description: 'Cornelius and Calvin Merry, before Kentucky, Indiana and Arkansas.' },
    { id: 'carolina', name: 'North Carolina', label: 'Quaker country', terms: ['north carolina', 'alamance', 'randolph', 'cane creek', 'guilford', 'orange county'], description: 'Cane Creek, the Regulators and the Quaker meetings of the Moffitt and Chamness families.', archive: 'alamance_battleground_1' },
    { id: 'britain', name: 'England & the British Isles', label: 'Across the Atlantic', terms: ['england', 'scotland', 'wales', 'ireland', 'lancashire', 'yorkshire', 'rotherham', 'lincoln', 'bowland'], description: 'The earliest recorded generations before the crossing to America.' }
  ]
};
document.title = window.SITE.title;
document.documentElement.dataset.site = window.SITE.id;
