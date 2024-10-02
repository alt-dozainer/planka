const { BASE_URL } = window;
const BASE_PATH = BASE_URL.replace(/^.*\/\/[^/]*(.*)[^?#]*.*$/, '$1');

const SERVER_BASE_URL =
  process.env.REACT_APP_SERVER_BASE_URL ||
  (process.env.NODE_ENV === 'production' ? BASE_URL : 'https://projects.dozainer.org');
const SERVER_BASE_PATH = SERVER_BASE_URL.replace(/^.*\/\/[^/]*(.*)[^?#]*.*$/, '$1');

const SERVER_HOST_NAME = SERVER_BASE_URL.replace(/^(.*\/\/[^/?#]*).*$/, '$1');

const ACCESS_TOKEN_KEY = 'accessToken';
const ACCESS_TOKEN_VERSION_KEY = 'accessTokenVersion';
const ACCESS_TOKEN_VERSION = '1';

const POSITION_GAP = 65535;
const ACTIVITIES_LIMIT = 50;

const APP_NAME =
  process.env.REACT_APP_NAME ||
  window.location.hostname.split('.')[0].split('localhost')[0] ||
  '🚧';

export default {
  BASE_PATH,
  SERVER_BASE_URL,
  SERVER_BASE_PATH,
  SERVER_HOST_NAME,
  ACCESS_TOKEN_KEY,
  ACCESS_TOKEN_VERSION_KEY,
  ACCESS_TOKEN_VERSION,
  POSITION_GAP,
  ACTIVITIES_LIMIT,
  APP_NAME,
};
