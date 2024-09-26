import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import selectors from '../selectors';
import entryActions from '../entry-actions';
import { BoardMembershipRoles } from '../constants/Enums';
import Board from '../components/Board';

const mapStateToProps = (state) => {
  const { cardId } = selectors.selectPath(state);
  const currentUserMembership = selectors.selectCurrentUserMembershipForCurrentBoard(state);
  const listIds = selectors.selectListIdsForCurrentBoard(state);
  const events = selectors.selectAllCardsForCurrentBoard(state);
  const selectListById = (name) => selectors.selectListByNameForCurrentBoard(state, name);
  const selectBoardByName = (name) => selectors.selectBoardByName(state, name);

  const isCurrentUserEditor =
    !!currentUserMembership && currentUserMembership.role === BoardMembershipRoles.EDITOR;

  return {
    listIds,
    isCardModalOpened: !!cardId,
    canEdit: isCurrentUserEditor,
    events,
    getListByName: selectListById,
    getBoardByName: selectBoardByName,
  };
};

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      onListCreate: entryActions.createListInCurrentBoard,
      onListMove: entryActions.moveList,
      onCardMove: entryActions.moveCard,
      onCardCreate: (listId, data, autoOpen) => entryActions.createCard(listId, data, autoOpen),
      onCardUpdate: (cardId, data) => entryActions.updateCard(cardId, data),
    },
    dispatch,
  );

export default connect(mapStateToProps, mapDispatchToProps)(Board);
