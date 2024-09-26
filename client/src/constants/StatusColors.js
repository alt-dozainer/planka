export const PLANNED = 'planned';
export const IN_PROGRESS = 'in_progress';
export const DONE = 'done';

export const getTranslationKey = (o, v) => {
  return Object.keys(o).find((k) => o[k] === v);
};

export default {
  [PLANNED]: 'backgroundLightConcrete',
  [IN_PROGRESS]: 'backgroundLightOrange',
  [DONE]: 'backgroundBrightMoss',
};
