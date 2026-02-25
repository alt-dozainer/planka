import { call, put, select } from 'redux-saga/effects';

import { updateCard, moveCard, deleteCard } from './cards';
import { createTask, updateTask } from './tasks';
import { addUserToCard, removeUserFromCard } from './users';
import { addLabelToCard, removeLabelFromCard } from './labels';
import request from '../request';
import selectors from '../../../selectors';
import actions from '../../../actions';
import api from '../../../api';
import { createLocalId } from '../../../utils/local-id';

function findCardByName(cards, cardName) {
  if (!cards || !cardName) return null;
  const lower = cardName.toLowerCase();
  return (
    cards.find((c) => c.name.toLowerCase() === lower) ||
    cards.find((c) => c.name.toLowerCase().includes(lower))
  );
}

function findMember(members, name) {
  if (!members || !name) return null;
  const lower = name.toLowerCase();
  return members.find(
    (m) => m.name.toLowerCase() === lower || (m.username && m.username.toLowerCase() === lower),
  );
}

function findTask(cards, taskName, cardName) {
  if (!cards || !taskName) return null;
  const lowerTask = taskName.toLowerCase();
  const searchCards = cardName
    ? cards.filter((c) => c.name.toLowerCase() === cardName.toLowerCase())
    : cards;

  for (let i = 0; i < searchCards.length; i += 1) {
    const card = searchCards[i];
    if (!card.tasks) continue; // eslint-disable-line no-continue
    const task =
      card.tasks.find((t) => t.name.toLowerCase() === lowerTask) ||
      card.tasks.find((t) => t.name.toLowerCase().includes(lowerTask));
    if (task) return task;
  }
  return null;
}

function findLabel(labels, name) {
  if (!labels || !name) return null;
  const lower = name.toLowerCase();
  return labels.find((l) => l.name && l.name.toLowerCase() === lower);
}

export function* processVoiceCommand(boardId, audioBlob) {
  let result;
  try {
    result = yield call(request, api.processVoiceCommand, boardId, audioBlob);
  } catch (error) {
    return;
  }

  const { actions: voiceActions, boardContext } = result;
  const createdCards = [];

  for (let i = 0; i < voiceActions.length; i += 1) {
    const action = voiceActions[i];

    if (action.type === 'createCard') {
      let listId;
      if (action.listName) {
        const list = yield select(selectors.selectListByNameForCurrentBoard, action.listName);
        if (list) {
          listId = list.id;
        }
      }

      if (!listId) {
        const listIds = yield select(selectors.selectListIdsForCurrentBoard);
        if (listIds && listIds.length > 0) {
          [listId] = listIds;
        }
      }

      if (!listId) continue; // eslint-disable-line no-continue

      const cardData = { name: action.name };
      if (action.dueDate) cardData.dueDate = new Date(action.dueDate);

      // Build JSON description with clientName, phoneNo, resourceId
      const descJson = {};
      if (action.clientName) descJson.clientName = action.clientName;
      if (action.phoneNo) descJson.phoneNo = action.phoneNo;
      if (action.resourceId) descJson.resourceId = action.resourceId;
      // Only use description if it's plain text (not JSON)
      if (action.description && !action.description.startsWith('{')) {
        descJson.description = action.description;
      }
      if (Object.keys(descJson).length > 0) {
        cardData.description = JSON.stringify(descJson);
      }

      const { boardId: cardBoardId } = yield select(selectors.selectListById, listId);
      const position = yield select(selectors.selectNextCardPosition, listId);
      const localId = yield call(createLocalId);

      yield put(
        actions.createCard({
          ...cardData,
          position,
          boardId: cardBoardId,
          listId,
          id: localId,
        }),
      );

      let createdCard;
      try {
        ({ item: createdCard } = yield call(request, api.createCard, listId, {
          ...cardData,
          position,
        }));
      } catch (error) {
        yield put(actions.createCard.failure(localId, error));
        continue; // eslint-disable-line no-continue
      }

      yield put(actions.createCard.success(localId, createdCard));
      createdCards.push({ id: createdCard.id, name: createdCard.name, listId: createdCard.listId });

      if (action.memberNames && action.memberNames.length > 0 && boardContext) {
        for (let j = 0; j < action.memberNames.length; j += 1) {
          const member = findMember(boardContext.members, action.memberNames[j]);
          if (member) {
            yield call(addUserToCard, member.id, createdCard.id);
          }
        }
      }

      if (action.labelNames && action.labelNames.length > 0 && boardContext) {
        for (let j = 0; j < action.labelNames.length; j += 1) {
          const label = findLabel(boardContext.labels, action.labelNames[j]);
          if (label) {
            yield call(addLabelToCard, label.id, createdCard.id);
          }
        }
      }

      if (action.tasks && action.tasks.length > 0) {
        for (let j = 0; j < action.tasks.length; j += 1) {
          yield call(createTask, createdCard.id, { name: action.tasks[j] });
        }
      }
    } else if (action.type === 'addMemberToCard') {
      const card =
        findCardByName(boardContext.cards, action.cardName) ||
        findCardByName(createdCards, action.cardName);
      if (!card) continue; // eslint-disable-line no-continue

      if (action.memberNames && action.memberNames.length > 0) {
        for (let j = 0; j < action.memberNames.length; j += 1) {
          const member = findMember(boardContext.members, action.memberNames[j]);
          if (member) {
            yield call(addUserToCard, member.id, card.id);
          }
        }
      }
    } else if (action.type === 'removeMemberFromCard') {
      const card =
        findCardByName(boardContext.cards, action.cardName) ||
        findCardByName(createdCards, action.cardName);
      if (!card) continue; // eslint-disable-line no-continue

      if (action.memberNames && action.memberNames.length > 0) {
        for (let j = 0; j < action.memberNames.length; j += 1) {
          const member = findMember(boardContext.members, action.memberNames[j]);
          if (member) {
            yield call(removeUserFromCard, member.id, card.id);
          }
        }
      }
    } else if (action.type === 'addLabelToCard') {
      const card =
        findCardByName(boardContext.cards, action.cardName) ||
        findCardByName(createdCards, action.cardName);
      if (!card) continue; // eslint-disable-line no-continue

      if (action.labelNames && action.labelNames.length > 0) {
        for (let j = 0; j < action.labelNames.length; j += 1) {
          const label = findLabel(boardContext.labels, action.labelNames[j]);
          if (label) {
            yield call(addLabelToCard, label.id, card.id);
          }
        }
      }
    } else if (action.type === 'removeLabelFromCard') {
      const card =
        findCardByName(boardContext.cards, action.cardName) ||
        findCardByName(createdCards, action.cardName);
      if (!card) continue; // eslint-disable-line no-continue

      if (action.labelNames && action.labelNames.length > 0) {
        for (let j = 0; j < action.labelNames.length; j += 1) {
          const label = findLabel(boardContext.labels, action.labelNames[j]);
          if (label) {
            yield call(removeLabelFromCard, label.id, card.id);
          }
        }
      }
    } else if (action.type === 'updateCard') {
      const card =
        findCardByName(boardContext.cards, action.cardName) ||
        findCardByName(createdCards, action.cardName);
      if (!card) continue; // eslint-disable-line no-continue

      const contextCard = boardContext.cards.find((c) => c.id === card.id);
      const isJson = contextCard && contextCard.isJsonDescription;

      const data = {};
      if (action.name) data.name = action.name;
      if (action.dueDate) data.dueDate = new Date(action.dueDate);

      const hasDescFields =
        action.clientName || action.phoneNo || action.resourceId || action.description;
      if (hasDescFields) {
        if (isJson) {
          // Existing description is JSON — merge into it
          const existing = {};
          if (contextCard.clientName) existing.clientName = contextCard.clientName;
          if (contextCard.phoneNo) existing.phoneNo = contextCard.phoneNo;
          if (contextCard.resourceId) existing.resourceId = contextCard.resourceId;
          if (contextCard.description) existing.description = contextCard.description;
          if (action.clientName) existing.clientName = action.clientName;
          if (action.phoneNo) existing.phoneNo = action.phoneNo;
          if (action.resourceId) existing.resourceId = action.resourceId;
          if (action.description && !action.description.startsWith('{')) {
            existing.description = action.description;
          }
          data.description = JSON.stringify(existing);
        } else if (action.description && !action.description.startsWith('{')) {
          // Existing description is plain text — overwrite raw
          data.description = action.description;
        }
      }

      if (Object.keys(data).length > 0) {
        yield call(updateCard, card.id, data);
      }
    } else if (action.type === 'moveCard') {
      const card =
        findCardByName(boardContext.cards, action.cardName) ||
        findCardByName(createdCards, action.cardName);
      if (!card) continue; // eslint-disable-line no-continue

      let listId;
      if (action.listName) {
        const list = yield select(selectors.selectListByNameForCurrentBoard, action.listName);
        if (list) listId = list.id;
      }

      if (listId) {
        yield call(moveCard, card.id, listId);
      }
    } else if (action.type === 'addTaskToCard') {
      const card =
        findCardByName(boardContext.cards, action.cardName) ||
        findCardByName(createdCards, action.cardName);
      if (!card) continue; // eslint-disable-line no-continue

      if (action.tasks && action.tasks.length > 0) {
        for (let j = 0; j < action.tasks.length; j += 1) {
          yield call(createTask, card.id, { name: action.tasks[j] });
        }
      }
    } else if (action.type === 'completeTask') {
      const task = findTask(boardContext.cards, action.taskName, action.cardName);
      if (task) {
        yield call(updateTask, task.id, { isCompleted: true });
      }
    } else if (action.type === 'uncompleteTask') {
      const task = findTask(boardContext.cards, action.taskName, action.cardName);
      if (task) {
        yield call(updateTask, task.id, { isCompleted: false });
      }
    } else if (action.type === 'deleteCard') {
      const card =
        findCardByName(boardContext.cards, action.cardName) ||
        findCardByName(createdCards, action.cardName);
      if (!card) continue; // eslint-disable-line no-continue

      yield call(deleteCard, card.id);
    }
  }
}

export default {
  processVoiceCommand,
};
