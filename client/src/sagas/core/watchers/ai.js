import { all, takeEvery } from 'redux-saga/effects';

import services from '../services';
import EntryActionTypes from '../../../constants/EntryActionTypes';

export default function* aiWatchers() {
  yield all([
    takeEvery(EntryActionTypes.VOICE_COMMAND_PROCESS, ({ payload: { boardId, audioBlob } }) =>
      services.processVoiceCommand(boardId, audioBlob),
    ),
  ]);
}
