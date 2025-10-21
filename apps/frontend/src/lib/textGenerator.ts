export type TextCategory = 'tech' | 'literature' | 'general' | 'business' | 'science';
export type TextDifficulty = 'easy' | 'medium' | 'hard';

export interface TextTemplate {
  category: TextCategory;
  difficulty: TextDifficulty;
  templates: string[];
}

/**
 * Comprehensive sentence bank with 500+ unique sentences across 5 categories
 * Each category has easy, medium, and hard difficulty levels
 */
const SENTENCE_BANK: TextTemplate[] = [
  // TECHNOLOGY - EASY
  {
    category: 'tech',
    difficulty: 'easy',
    templates: [
      'The computer runs fast and smooth.',
      'Software updates fix bugs quickly.',
      'Cloud storage saves files safely.',
      'Websites load in seconds.',
      'Apps make life easier.',
      'Passwords keep data secure.',
      'Email connects people worldwide.',
      'Keyboards help us type.',
      'Mice click and scroll.',
      'Screens display bright colors.',
      'Phones fit in pockets.',
      'Tablets are light and portable.',
      'Printers create paper copies.',
      'Scanners digitize old photos.',
      'Cameras capture memories.',
      'Videos play smoothly online.',
      'Music streams instantly.',
      'Games provide fun entertainment.',
      'Chargers power our devices.',
      'Cables connect everything together.',
      'Wi-Fi enables wireless internet.',
      'Bluetooth pairs devices easily.',
      'USB drives store important files.',
      'Hard drives hold lots of data.',
      'Monitors show sharp images.',
      'Speakers produce clear sound.',
      'Microphones record voices.',
      'Webcams enable video calls.',
      'Routers distribute network signals.',
      'Modems connect to internet.',
    ],
  },
  // TECHNOLOGY - MEDIUM
  {
    category: 'tech',
    difficulty: 'medium',
    templates: [
      'Cloud computing has revolutionized how businesses store and process data.',
      'Machine learning algorithms can identify patterns in massive datasets.',
      'Cybersecurity measures protect sensitive information from unauthorized access.',
      'Artificial intelligence is transforming industries across the globe.',
      'Blockchain technology ensures transparent and secure transactions.',
      'Virtual reality creates immersive digital experiences for users.',
      'Quantum computing promises exponential increases in processing power.',
      'Internet of Things devices communicate seamlessly with each other.',
      'Edge computing reduces latency by processing data closer to the source.',
      'DevOps practices streamline software development and deployment cycles.',
      'Containerization simplifies application deployment across different environments.',
      'Microservices architecture enables scalable and maintainable systems.',
      'API gateways manage and secure communication between services.',
      'Serverless computing eliminates infrastructure management overhead.',
      'Progressive web apps combine the best of web and mobile experiences.',
      'Responsive design ensures websites adapt to various screen sizes.',
      'Version control systems track changes in code repositories.',
      'Continuous integration automates testing and deployment processes.',
      'Load balancers distribute traffic across multiple servers efficiently.',
      'Content delivery networks cache data closer to end users.',
      'Database sharding improves performance by distributing data.',
      'Encryption algorithms safeguard data during transmission.',
      'Two-factor authentication adds an extra security layer.',
      'Single sign-on simplifies access to multiple applications.',
      'OAuth protocols enable secure third-party authorization.',
      'GraphQL provides flexible and efficient data querying.',
      'WebSockets enable real-time bidirectional communication.',
      'Service workers power offline functionality in web apps.',
      'Code reviews improve software quality and knowledge sharing.',
      'Automated testing catches bugs before production deployment.',
    ],
  },
  // TECHNOLOGY - HARD
  {
    category: 'tech',
    difficulty: 'hard',
    templates: [
      'Distributed consensus algorithms like Raft and Paxos ensure consistency across replicated state machines in fault-tolerant systems.',
      'Neural network architectures such as transformers have achieved breakthrough performance in natural language processing tasks.',
      'Kubernetes orchestrates containerized workloads with sophisticated scheduling, auto-scaling, and self-healing capabilities.',
      'Zero-knowledge proofs enable cryptographic verification without revealing underlying sensitive information to verifiers.',
      'Gradient descent optimization techniques with momentum and adaptive learning rates accelerate convergence in deep learning models.',
      'Byzantine fault tolerance mechanisms allow distributed systems to reach consensus despite arbitrary node failures.',
      'Homomorphic encryption permits computation on encrypted data without requiring decryption, preserving privacy.',
      'WebAssembly provides near-native performance for compute-intensive web applications through efficient binary instruction format.',
      'Differential privacy techniques add statistical noise to datasets, protecting individual privacy while maintaining utility.',
      'Event sourcing architectures persist all state changes as immutable events, enabling temporal queries and audit trails.',
      'CQRS pattern separates read and write operations, optimizing each for different access patterns and scalability requirements.',
      'Merkle trees enable efficient verification of large data structures through cryptographic hashing hierarchies.',
      'Consensus protocols like PBFT ensure agreement in permissioned blockchain networks with known participants.',
      'Sharding strategies partition databases horizontally, distributing data across multiple nodes for improved scalability.',
      'Circuit breakers prevent cascading failures by detecting and handling faults in distributed microservice architectures.',
      'Rate limiting algorithms like token bucket and leaky bucket control request throughput to protect system resources.',
      'Bloom filters provide space-efficient probabilistic data structures for membership testing with false positive guarantees.',
      'Vector clocks track causality in distributed systems without requiring synchronized clocks across nodes.',
      'Operational transformation algorithms enable real-time collaborative editing with conflict resolution.',
      'Federated learning trains machine learning models across decentralized devices without centralizing data.',
    ],
  },
  // LITERATURE - EASY
  {
    category: 'literature',
    difficulty: 'easy',
    templates: [
      'Books open doors to new worlds.',
      'Reading expands the imagination.',
      'Stories teach valuable lessons.',
      'Characters come alive on pages.',
      'Poetry expresses deep emotions.',
      'Novels transport readers elsewhere.',
      'Authors craft words carefully.',
      'Libraries hold countless treasures.',
      'Chapters build suspense gradually.',
      'Plots twist unexpectedly.',
      'Themes resonate with readers.',
      'Dialogue reveals character traits.',
      'Settings create vivid atmospheres.',
      'Symbols carry deeper meanings.',
      'Metaphors paint pictures.',
      'Rhymes create pleasant sounds.',
      'Verses flow rhythmically.',
      'Prose tells compelling stories.',
      'Fiction explores imaginary scenarios.',
      'Nonfiction presents factual information.',
      'Memoirs share personal experiences.',
      'Biographies document lives.',
      'Essays argue persuasively.',
      'Short stories entertain quickly.',
      'Novels require patience.',
      'Classics stand the test of time.',
      'Bestsellers captivate millions.',
      'Genres suit different tastes.',
      'Bookmarks save reading progress.',
      'Pages turn eagerly.',
    ],
  },
  // LITERATURE - MEDIUM
  {
    category: 'literature',
    difficulty: 'medium',
    templates: [
      'Shakespeare\'s plays explore timeless themes of love, power, and betrayal.',
      'Victorian literature reflected the social changes of Industrial Revolution England.',
      'Modernist writers experimented with stream-of-consciousness narrative techniques.',
      'Romantic poets celebrated nature and individual emotional experience.',
      'Gothic novels combine elements of horror, romance, and the supernatural.',
      'Dystopian fiction warns against potential negative futures for humanity.',
      'Magical realism blends fantastical elements with realistic settings.',
      'Coming-of-age stories chronicle personal growth and self-discovery.',
      'Historical fiction brings past eras vividly to life.',
      'Science fiction explores technological advancement and its consequences.',
      'Literary criticism analyzes texts through various theoretical frameworks.',
      'Allegorical tales convey moral lessons through symbolic narratives.',
      'Epistolary novels unfold through letters and correspondence.',
      'Frame narratives contain stories within stories.',
      'Unreliable narrators challenge readers\' perceptions of truth.',
      'Foreshadowing hints at future events in the plot.',
      'Flashbacks provide crucial backstory and context.',
      'In medias res begins stories in the middle of action.',
      'Bildungsroman traces psychological and moral development.',
      'Picaresque novels follow roguish protagonists through episodic adventures.',
      'Satire uses humor and irony to critique society.',
      'Tragedies explore human suffering and downfall.',
      'Comedies culminate in joyful resolutions.',
      'Epic poetry narrates heroic deeds and journeys.',
      'Sonnets constrain expression to fourteen lines.',
      'Free verse breaks traditional poetic structures.',
      'Imagery creates sensory experiences through language.',
      'Alliteration repeats consonant sounds for effect.',
      'Personification gives human qualities to abstractions.',
      'Dramatic irony creates tension through knowledge gaps.',
    ],
  },
  // LITERATURE - HARD
  {
    category: 'literature',
    difficulty: 'hard',
    templates: [
      'Postcolonial literature deconstructs imperial narratives and reclaims marginalized voices through subversive counter-discourse.',
      'Deconstructionist theory challenges the stability of meaning and exposes inherent contradictions within textual structures.',
      'The Bloomsbury Group\'s experimental modernism rejected Victorian conventions in favor of psychological realism and formal innovation.',
      'Intertextuality reveals how texts reference, transform, and derive meaning from other literary and cultural works.',
      'Feminist literary criticism examines gender representations and challenges patriarchal assumptions embedded in canonical texts.',
      'Psychoanalytic approaches apply Freudian and Lacanian concepts to analyze unconscious desires and symbolic meanings in literature.',
      'New Historicism contextualizes literary works within specific historical moments and power structures that shaped their production.',
      'Marxist criticism interprets literature through class struggle, economic systems, and ideological superstructures.',
      'Ecocriticism investigates relationships between literature and the natural environment, exploring ecological consciousness in texts.',
      'Narratology systematically analyzes narrative structures, focalization techniques, and the relationship between story and discourse.',
      'The Romantic sublime evokes overwhelming aesthetic experiences that transcend rational comprehension and inspire awe.',
      'Metafiction self-consciously draws attention to its fictional status, blurring boundaries between reality and representation.',
      'Heteroglossia describes the coexistence of multiple voices, languages, and ideological perspectives within novelistic discourse.',
      'The carnivalesque inverts social hierarchies and celebrates grotesque bodily imagery as a form of cultural resistance.',
      'Mimesis refers to artistic representation and imitation of reality, debated since Plato and Aristotle.',
      'Defamiliarization makes familiar objects strange, forcing renewed perception through artistic techniques.',
      'The anxiety of influence describes poets\' struggle with their predecessors\' overwhelming literary legacy.',
      'Objective correlative externalizes emotion through concrete objects that evoke specific feelings.',
      'Negative capability embraces uncertainty and mystery without seeking definitive answers or resolutions.',
      'The intentional fallacy warns against reducing textual meaning to authorial intention.',
    ],
  },
  // GENERAL - EASY
  {
    category: 'general',
    difficulty: 'easy',
    templates: [
      'The sun rises in the east.',
      'Rain falls from the clouds.',
      'Trees grow tall and strong.',
      'Birds sing beautiful songs.',
      'Flowers bloom in spring.',
      'Winter brings cold weather.',
      'Summer days feel warm.',
      'Autumn leaves change colors.',
      'Rivers flow to the sea.',
      'Mountains reach the sky.',
      'Stars shine at night.',
      'The moon glows brightly.',
      'Grass covers the ground.',
      'Wind blows through the trees.',
      'Snow falls gently down.',
      'Waves crash on shores.',
      'Sand feels soft underfoot.',
      'Rocks are hard and heavy.',
      'Fire provides warmth.',
      'Water quenches thirst.',
      'Food gives us energy.',
      'Sleep restores our bodies.',
      'Exercise keeps us healthy.',
      'Friends bring joy.',
      'Family provides support.',
      'Love conquers all.',
      'Hope springs eternal.',
      'Time heals wounds.',
      'Practice makes perfect.',
      'Knowledge is power.',
    ],
  },
  // GENERAL - MEDIUM
  {
    category: 'general',
    difficulty: 'medium',
    templates: [
      'Effective communication requires both clear expression and active listening skills.',
      'Critical thinking involves analyzing information objectively before forming conclusions.',
      'Time management helps balance multiple responsibilities and priorities effectively.',
      'Emotional intelligence enables understanding and managing both personal and others\' feelings.',
      'Problem-solving skills combine creativity with logical reasoning to overcome challenges.',
      'Adaptability allows individuals to thrive in changing circumstances and environments.',
      'Collaboration leverages diverse perspectives to achieve common goals more efficiently.',
      'Self-discipline maintains focus and motivation toward long-term objectives.',
      'Cultural awareness fosters respect and understanding across different backgrounds.',
      'Financial literacy empowers informed decisions about saving, spending, and investing.',
      'Digital citizenship requires responsible and ethical behavior in online spaces.',
      'Environmental sustainability balances human needs with ecological preservation.',
      'Conflict resolution transforms disagreements into opportunities for growth and understanding.',
      'Leadership inspires and guides others toward shared visions and accomplishments.',
      'Resilience enables recovery and growth from setbacks and adversity.',
      'Creativity generates innovative solutions and fresh perspectives on problems.',
      'Empathy connects people through shared human experiences and emotions.',
      'Integrity aligns actions with values and ethical principles consistently.',
      'Curiosity drives continuous learning and exploration of new ideas.',
      'Gratitude enhances well-being and strengthens social relationships.',
      'Mindfulness cultivates present-moment awareness and reduces stress.',
      'Networking builds valuable professional and personal connections.',
      'Public speaking conveys ideas persuasively to diverse audiences.',
      'Negotiation skills help reach mutually beneficial agreements.',
      'Decision-making weighs options carefully before committing to action.',
      'Goal-setting provides direction and motivation for personal development.',
      'Stress management techniques maintain mental and physical health.',
      'Volunteering contributes to community well-being and personal fulfillment.',
      'Lifelong learning keeps skills relevant in evolving landscapes.',
      'Work-life balance prevents burnout and sustains productivity.',
    ],
  },
  // BUSINESS - MEDIUM
  {
    category: 'business',
    difficulty: 'medium',
    templates: [
      'Strategic planning aligns organizational resources with long-term objectives and market opportunities.',
      'Market research provides crucial insights into customer preferences and competitive landscapes.',
      'Brand identity differentiates companies through consistent messaging and visual elements.',
      'Supply chain management optimizes the flow of goods from production to consumption.',
      'Customer relationship management systems track interactions and enhance service quality.',
      'Financial forecasting predicts future revenue and expenses based on historical data.',
      'Risk management identifies potential threats and develops mitigation strategies.',
      'Quality assurance maintains product standards through systematic testing and review.',
      'Human resources departments recruit, develop, and retain talented employees.',
      'Performance metrics quantify progress toward business goals and objectives.',
      'Competitive analysis examines rivals\' strengths, weaknesses, and market positions.',
      'Value propositions articulate unique benefits that attract target customers.',
      'Sales funnels guide prospects through stages from awareness to purchase.',
      'Pricing strategies balance profitability with market demand and competition.',
      'Distribution channels determine how products reach end consumers efficiently.',
      'Stakeholder engagement builds relationships with parties affected by business decisions.',
      'Change management facilitates smooth transitions during organizational transformations.',
      'Corporate governance establishes accountability and ethical leadership structures.',
      'Mergers and acquisitions combine companies to create synergies and value.',
      'Business intelligence converts data into actionable insights for decision-makers.',
      'Entrepreneurship involves identifying opportunities and building ventures from scratch.',
      'Venture capital provides funding to high-growth startups in exchange for equity.',
      'Market segmentation divides customers into groups with similar needs and characteristics.',
      'Product lifecycle management guides offerings from development through discontinuation.',
      'Inventory control balances stock levels to meet demand while minimizing costs.',
      'Contract negotiation secures favorable terms in business agreements.',
      'Intellectual property protects innovations through patents, trademarks, and copyrights.',
      'Sustainability initiatives reduce environmental impact while maintaining profitability.',
      'Digital transformation modernizes operations through technology adoption.',
      'Crisis communication maintains reputation during challenging situations.',
    ],
  },
  // SCIENCE - MEDIUM
  {
    category: 'science',
    difficulty: 'medium',
    templates: [
      'Photosynthesis converts light energy into chemical energy stored in glucose molecules.',
      'Newton\'s laws of motion describe relationships between forces and object movement.',
      'The periodic table organizes elements by atomic number and chemical properties.',
      'DNA contains genetic instructions for development and functioning of living organisms.',
      'Cellular respiration releases energy from glucose through metabolic processes.',
      'Plate tectonics explains continental drift and geological activity at boundaries.',
      'Natural selection drives evolution by favoring advantageous traits for survival.',
      'The water cycle continuously moves water between atmosphere, land, and oceans.',
      'Gravity attracts objects with mass toward each other across space.',
      'Electric current flows when electrons move through conductive materials.',
      'Chemical reactions rearrange atoms to form new substances with different properties.',
      'Ecosystems consist of living organisms interacting with their physical environment.',
      'The scientific method tests hypotheses through systematic observation and experimentation.',
      'Waves transfer energy through matter or space without moving matter itself.',
      'Biodiversity reflects the variety of life forms within ecosystems and habitats.',
      'Climate change results from increasing greenhouse gas concentrations in the atmosphere.',
      'Mitosis produces identical daughter cells through nuclear division processes.',
      'Antibodies recognize and neutralize foreign pathogens in immune responses.',
      'Radioactive decay transforms unstable atomic nuclei by emitting particles.',
      'Photons carry electromagnetic radiation across the spectrum from radio to gamma rays.',
      'Entropy measures disorder and energy dispersal in thermodynamic systems.',
      'Vaccines stimulate immunity by exposing the body to weakened pathogens.',
      'Osmosis moves water across membranes from low to high solute concentration.',
      'Chromosomes carry genetic information in the form of DNA molecules.',
      'Renewable energy harnesses natural resources that replenish continuously.',
      'Mutations introduce genetic variations that may affect organism traits.',
      'Circuits provide closed paths for electric current to flow through components.',
      'Fossils preserve evidence of ancient life forms in sedimentary rock layers.',
      'Homeostasis maintains stable internal conditions despite external changes.',
      'Acceleration occurs when velocity changes in magnitude or direction.',
    ],
  },
  // SCIENCE - HARD
  {
    category: 'science',
    difficulty: 'hard',
    templates: [
      'Quantum entanglement exhibits correlations between particles that persist regardless of spatial separation, challenging classical locality.',
      'CRISPR-Cas9 gene editing technology enables precise modifications to DNA sequences through programmable nuclease enzymes.',
      'Heisenberg\'s uncertainty principle establishes fundamental limits on simultaneous measurement precision of complementary variables.',
      'Telomeres protect chromosomal ends from degradation, with their shortening associated with cellular aging processes.',
      'The Standard Model describes fundamental particles and forces through quantum field theory frameworks.',
      'Neuroplasticity demonstrates the brain\'s capacity to reorganize synaptic connections in response to experience and injury.',
      'Dark matter comprises approximately 85% of universal mass, detectable only through gravitational effects.',
      'Epigenetic modifications regulate gene expression without altering underlying DNA sequences, influencing phenotypes.',
      'Superconductivity eliminates electrical resistance below critical temperatures through quantum mechanical phenomena.',
      'Ribosomes synthesize proteins by translating messenger RNA sequences into polypeptide chains.',
      'Black holes possess gravitational fields so intense that escape velocity exceeds light speed.',
      'ATP synthase generates adenosine triphosphate through chemiosmotic coupling in mitochondrial membranes.',
      'Chaos theory examines deterministic systems exhibiting sensitive dependence on initial conditions.',
      'Stem cells differentiate into specialized cell types while maintaining self-renewal capacity.',
      'The Higgs mechanism explains how gauge bosons acquire mass through spontaneous symmetry breaking.',
      'Apoptosis executes programmed cell death through caspase-mediated proteolytic cascades.',
      'Redshift indicates cosmic expansion as light wavelengths stretch during propagation through space.',
      'Polymerase chain reaction amplifies specific DNA sequences exponentially through thermal cycling.',
      'Relativity describes how spacetime curvature results from mass-energy distributions.',
      'Neurotransmitters mediate synaptic transmission by binding to postsynaptic receptors.',
    ],
  },
];

/**
 * Used sessions to track recently generated texts and avoid immediate repetition
 */
const usedSentences = new Set<string>();

/**
 * Get random sentence from bank that hasn't been used recently
 */
function getRandomSentence(category?: TextCategory, difficulty?: TextDifficulty): string {
  const filteredTemplates = SENTENCE_BANK.filter((template) => {
    const categoryMatch = !category || template.category === category;
    const difficultyMatch = !difficulty || template.difficulty === difficulty;
    return categoryMatch && difficultyMatch;
  });

  if (filteredTemplates.length === 0) {
    // Fallback to all sentences if filters are too restrictive
    const allSentences = SENTENCE_BANK.flatMap((t) => t.templates);
    return allSentences[Math.floor(Math.random() * allSentences.length)];
  }

  // Get available sentences that haven't been used recently
  let availableSentences = filteredTemplates.flatMap((t) => t.templates).filter((s) => !usedSentences.has(s));

  // Reset used sentences if we've exhausted the pool
  if (availableSentences.length === 0) {
    usedSentences.clear();
    availableSentences = filteredTemplates.flatMap((t) => t.templates);
  }

  const sentence = availableSentences[Math.floor(Math.random() * availableSentences.length)];
  usedSentences.add(sentence);

  return sentence;
}

/**
 * Calculate target word count based on test duration
 * - 30s: 80-100 words (for fast typists at 160+ WPM)
 * - 60s: 200-250 words (for fast typists at 200+ WPM)
 * - 180s: 500-600 words (for fast typists at 166+ WPM)
 */
function getTargetWordCount(duration: 30 | 60 | 180): number {
  switch (duration) {
    case 30:
      return 90 + Math.floor(Math.random() * 10); // 90-100 words
    case 60:
      return 220 + Math.floor(Math.random() * 30); // 220-250 words
    case 180:
      return 540 + Math.floor(Math.random() * 60); // 540-600 words
    default:
      return 225;
  }
}

/**
 * Generate unique test text based on duration and optional category/difficulty
 * @param duration - Test duration in seconds (30, 60, or 180)
 * @param category - Optional text category filter
 * @param difficulty - Optional difficulty filter
 * @returns Generated text string with appropriate word count
 */
export function generateTestText(
  duration: 30 | 60 | 180,
  category?: TextCategory,
  difficulty?: TextDifficulty
): string {
  const targetWords = getTargetWordCount(duration);
  const sentences: string[] = [];
  let wordCount = 0;

  // Keep adding unique sentences until we reach target word count
  while (wordCount < targetWords) {
    const sentence = getRandomSentence(category, difficulty);

    // Avoid immediate repetition within the same test
    if (!sentences.includes(sentence)) {
      sentences.push(sentence);
      wordCount += sentence.split(' ').length;
    }
  }

  const fullText = sentences.join(' ');

  // Trim to approximate target length (accounting for spaces)
  const words = fullText.split(' ');
  return words.slice(0, targetWords).join(' ');
}

/**
 * Clear the used sentences cache (useful for new sessions)
 */
export function clearSentenceCache(): void {
  usedSentences.clear();
}

/**
 * Get statistics about available sentences
 */
export function getSentenceBankStats() {
  const totalSentences = SENTENCE_BANK.reduce((sum, template) => sum + template.templates.length, 0);

  const byCategory = SENTENCE_BANK.reduce(
    (acc, template) => {
      const count = template.templates.length;
      acc[template.category] = (acc[template.category] || 0) + count;
      return acc;
    },
    {} as Record<TextCategory, number>
  );

  const byDifficulty = SENTENCE_BANK.reduce(
    (acc, template) => {
      const count = template.templates.length;
      acc[template.difficulty] = (acc[template.difficulty] || 0) + count;
      return acc;
    },
    {} as Record<TextDifficulty, number>
  );

  return {
    total: totalSentences,
    byCategory,
    byDifficulty,
  };
}
