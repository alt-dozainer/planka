import Config from './Config';

const ROOT = `${Config.BASE_PATH}/`;
const LOGIN = `${Config.BASE_PATH}/login`;
const OIDC_CALLBACK = `${Config.BASE_PATH}/oidc-callback`;
const PROJECTS = `${Config.BASE_PATH}/projects/:id`;
const BOARDS = `${Config.BASE_PATH}/boards/:id`;
const CARDS = `${Config.BASE_PATH}/cards/:id`;
const BOARD_CALENDAR = `${Config.BASE_PATH}/boards/:id?v=events`;

export default {
  ROOT,
  LOGIN,
  OIDC_CALLBACK,
  PROJECTS,
  BOARDS,
  CARDS,
  BOARD_CALENDAR,
};
