/* Site settings. Everything that differs between the family archives lives here and in the data files;
   index.html, app.js and the shared modules are identical on both sites. */
window.SITE = {
  id: 'family',
  storage: 'sloan-family',
  title: 'Family Roots',
  data: 'content',                        // data.json + tree.json, converted by adapter.js
  rootName: 'You',
  rootPossessive: 'Our',
  text: {
    brandSmall: 'Thompson · Hulsey · Moffitt · Smith',
    heroTitle: 'Family history and stories.',
    heroIntro: 'From the Choctaw Nation to Quaker North Carolina, explore the stories, records and photographs of our ancestors. Open any story or person to read more, see the original records, and check the sources.',
    heroNote: 'Relationships are shown from the family member at the center of this tree. Explore both sides of the family.',
    gpIntro: 'Explore the family lines and the records that connect generations.',
    placesPath: 'From the Choctaw Nation to Arkansas, Kentucky and North Carolina.',
    momBlurb: 'Livesay and Sandridge families in Texas and Oklahoma.',
    momNames: 'Livesay · Sandridge',
    dadBlurb: 'Choctaw Nation, Arkansas, Kentucky, North Carolina and beyond.',
    dadNames: 'Moffitt · Thompson · Hulsey · Smith',
    rootGroup: 'Our generation',
    aboutIntro: 'This family history follows the records. Each story is marked with how well the records support it, and the sources are listed with every story.',
    aboutCompare: 'Relationships are shown from the center of this tree. Living people are represented by their family roles.',
    fixesTitle: 'Corrections and research notes',
    sources: 'Dawes enrollment cards and allotment files; 1896 Choctaw census; U.S. censuses 1880–1940; WPA Indian-Pioneer interviews #7392 and #7418 (1937); WWI and WWII draft registrations; U.S. Navy muster rolls; Colonial and State Records of North Carolina; Randolph County wills; Hinshaw’s Encyclopedia of American Quaker Genealogy; Indiana Adjutant General’s Report; Kappler’s Indian Affairs: Laws and Treaties; newspaper obituaries.',
    credits: 'Family photographs come from the Moffitt Family Tree on Ancestry. Some have been restored or colorized with AI; colors and reconstructed details are interpretations. The originals are available for comparison. Marmon Wasp photo by OctaviaCombi and Alamance plaque photo by Hallcp, CC BY-SA 4.0 via Wikimedia Commons; USS Chief photo, U.S. Navy (NH 96996); 1919 code letter, U.S. Army. Hugo (1910 street view and 1912 Frisco shops postcard), Butler County, Allen County and Gibson County photographs: Wikimedia Commons, public domain. Mountain View courthouse photo by Sgerbic, CC BY-SA 4.0, via Wikimedia Commons.'
  },
  lineBlurbs: ['Moffitt and Smith family branches', 'Thompson and Hulsey family branches', 'Livesay family branches', 'Sandridge family branches'],
  heroKeys: ['henry_hannah', 'gilbert_parsis', 'daniel_oneal', 'vashti_framed', 'joel_ira', 'mary_tinsley', 'rebecca_graves', 'parsis_portrait', 'william_junior', 'faye_moffitt'],
  featured: [],
  topics: {
    choctaw: { label: 'Choctaw Nation', copy: 'Enrollment, allotments, courts and family life in the Choctaw Nation.', tag: 'choctaw',
      journey: ['fort-towson-post', 'removal', 'mig-pisachubbe-first-exiles', 'mig-doaksville-1833-removal', 'vincent', 'book2-doak-tims-contracts-1838', 'doaksville-constitution-1860', 'edward', 'joseph', 'betsy', 'simon', 'edith-thompson-slaton'] },
    military: { label: 'Military service', copy: 'From the Revolution and the Civil War to the World Wars and the Navy.', tag: 'military',
      journey: ['moff-after-alamance', 'wm-after-alamance', 'fort-towson-post', 'daniel', 'hulsey-42nd-perryville-stones-river', 'hulsey-42nd-atlanta-campaign', 'watie-surrender-doaksville', 'edmond', 'gwhulsey', 'jwm', 'ard19-leyte', 'uss-chief-nagoya'] },
    quaker: { label: 'Quaker roots', copy: 'Meetings, migrations and the Quaker families of the Carolinas and beyond.', tag: 'quaker',
      journey: ['wt2-henry-janet-croasdale', 'wt-richard-margery-browne', 'wt-dorothy-butler-gaunt', 'wt-john-bridget-cowgill', 'wt2-william-croasdale', 'anthony', 'rogers', 'marydavies', 'cane-creek-1763', 'moff-after-alamance', 'wm-mary-wills', 'aden'] },
    notable: { label: 'Notable lives', copy: 'Leaders, witnesses and unusual turns in the family’s history.', tag: 'notable' }
  },
  regions: [
    { id: 'choctaw', name: 'Hugo & the Choctaw Nation', label: 'Oklahoma', terms: ['choctaw', 'hugo', 'jeter', 'doaksville', 'fort towson', 'kiamitia', 'cedar county', 'speer', 'sawyer', 'boswell', 'goodland', 'grant'], description: 'Thompson, Tims and Pisachubbe families in the Choctaw Nation, and the Moffitts, Smiths and Hulseys who settled around Hugo.', archive: 'hugo_1910' },
    { id: 'arkansas', name: 'Arkansas hill country', label: 'Arkansas', terms: ['arkansas', 'stone county', 'mountain view', 'montgomery county', 'garland', 'hot springs', 'story, ark'], description: 'The Moffitt and Hulsey families in Stone, Montgomery and Garland counties.', archive: 'mountainview_courthouse' },
    { id: 'texas', name: 'Northeast Texas', label: 'Texas', terms: ['paris, texas', 'lamar', 'franklin county', 'red river county', 'texas'], description: 'Paris, Lamar County and the farm country across the Red River from Hugo.' },
    { id: 'kentucky', name: 'Kentucky', label: 'Kentucky', terms: ['kentucky', 'allen county', 'butler county'], description: 'The Smith and Satterfield families of Allen and Butler counties.', archive: 'allen_courthouse' },
    { id: 'indiana', name: 'Indiana', label: 'Indiana', terms: ['indiana', 'gibson county'], description: 'Stevenson and O’Neal families in Gibson County.', archive: 'gibson_courthouse' },
    { id: 'tennessee', name: 'Tennessee & Alabama', label: 'The South', terms: ['tennessee', 'pulaski', 'giles', 'alabama', 'etowah', 'st clair'], description: 'Stevenson, Shackleford and Newton families before the move west.' },
    { id: 'carolina', name: 'North Carolina', label: 'Quaker country', terms: ['north carolina', 'alamance', 'randolph', 'cane creek', 'guilford', 'orange county'], description: 'Cane Creek, the Regulators and the Quaker meetings of the Moffitt and Chamness families.', archive: 'alamance_battleground_1' },
    { id: 'britain', name: 'England & the British Isles', label: 'Across the Atlantic', terms: ['england', 'scotland', 'wales', 'ireland', 'lancashire', 'yorkshire', 'rotherham', 'lincoln', 'bowland'], description: 'The earliest recorded generations before the crossing to America.' }
  ]
};
document.title = window.SITE.title;
document.documentElement.dataset.site = window.SITE.id;
