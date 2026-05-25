import 'server-only';

const dictionaries = {
  fr: () => import('../dictionaries/fr.json').then((module) => module.default),
  ar: () => import('../dictionaries/ar.json').then((module) => module.default),
};

export const getDictionary = async (locale) => {
  // Fallback to 'fr' if locale doesn't exist
  const loadDict = dictionaries[locale] || dictionaries['fr'];
  return loadDict();
};
