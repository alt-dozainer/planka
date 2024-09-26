import { connect } from 'react-redux';

import selectors from '../selectors';
import Static from '../components/Static';

const mapStateToProps = (state) => {
  const { cardId, projectId } = selectors.selectPath(state);
  const currentBoard = selectors.selectCurrentBoard(state);
  const projects = selectors.selectProjectsForCurrentUser(state);

  return {
    projectId,
    cardId,
    board: currentBoard,
    projects,
  };
};

export default connect(mapStateToProps)(Static);
