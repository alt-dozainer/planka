import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import selectors from '../selectors';
import entryActions from '../entry-actions';
import Boards from '../components/Boards';

const mapStateToProps = (state) => {
  const { boardId } = selectors.selectPath(state);
  const boards = selectors.selectBoardsForCurrentProject(state);
  const isCurrentUserManager = selectors.selectIsCurrentUserManagerForCurrentProject(state);
  const allLabels = selectors.selectLabelsForCurrentBoard(state);
  const currentUser = selectors.selectCurrentUser(state);

  // const list = selectors.selectBoardByName(state, 'masini');
  // if (list) {
  //   const listId = list.id;
  //   const cardIds = selectors.selectCardIdsByListId(state, listId);
  //   console.log('List', list);
  // }

  return {
    items: boards,
    currentId: boardId,
    canEdit: isCurrentUserManager,
    allLabels,
    currentUser,
  };
};

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      onCreate: entryActions.createBoardInCurrentProject,
      onUpdate: entryActions.updateBoard,
      onMove: entryActions.moveBoard,
      onDelete: entryActions.deleteBoard,
      onLabelCreate: entryActions.createLabelInCurrentBoard,
      onLabelUpdate: entryActions.updateLabel,
      onLabelMove: entryActions.moveLabel,
      onLabelDelete: entryActions.deleteLabel,
    },
    dispatch,
  );

export default connect(mapStateToProps, mapDispatchToProps)(Boards);
