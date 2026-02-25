import EntryActionTypes from '../constants/EntryActionTypes';

const processVoiceCommand = (boardId, audioBlob) => ({
  type: EntryActionTypes.VOICE_COMMAND_PROCESS,
  payload: {
    boardId,
    audioBlob,
  },
});

export default {
  processVoiceCommand,
};
