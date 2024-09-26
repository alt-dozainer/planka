import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation, Trans } from 'react-i18next';
import { Icon, Loader } from 'semantic-ui-react';
import { useNavigate } from 'react-router-dom';
import ProjectsContainer from '../../containers/ProjectsContainer';
import BoardContainer from '../../containers/BoardContainer';
import Paths from '../../constants/Paths';

import styles from './Static.module.scss';

function Static({ projectId, cardId, board, projects }) {
  const [t] = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (projects[0]?.firstBoardId && !board && window.location.search.indexOf('?admin') === -1) {
      navigate(Paths.BOARDS.replace(':id', projects[0].firstBoardId));
    }
    return () => {};
  }, [navigate, projects, board]);

  if (projectId === undefined) {
    return (
      <div className={styles.wrapper}>
        <ProjectsContainer />
      </div>
    );
  }

  if (cardId === null) {
    return (
      <div className={classNames(styles.wrapper, styles.wrapperFlex)}>
        <div className={styles.message}>
          <h1>
            {t('common.cardNotFound', {
              context: 'title',
            })}
          </h1>
        </div>
      </div>
    );
  }

  if (board === null) {
    return (
      <div className={classNames(styles.wrapper, styles.wrapperFlex)}>
        <div className={styles.message}>
          <h1>
            {t('common.boardNotFound', {
              context: 'title',
            })}
          </h1>
        </div>
      </div>
    );
  }

  if (projectId === null) {
    return (
      <div className={classNames(styles.wrapper, styles.wrapperFlex)}>
        <div className={styles.message}>
          <h1>
            {t('common.projectNotFound', {
              context: 'title',
            })}
          </h1>
        </div>
      </div>
    );
  }

  if (board === undefined) {
    return (
      <div className={classNames(styles.wrapper, styles.wrapperFlex, styles.wrapperProject)}>
        <div className={styles.message}>
          <Icon inverted name="hand point up outline" size="huge" className={styles.messageIcon} />
          <h1 className={styles.messageTitle}>
            {t('common.openBoard', {
              context: 'title',
            })}
          </h1>
          <div className={styles.messageContent}>
            <Trans i18nKey="common.createNewOneOrSelectExistingOne" />
          </div>
        </div>
      </div>
    );
  }

  if (board.isFetching) {
    return (
      <div className={classNames(styles.wrapper, styles.wrapperLoader, styles.wrapperProject)}>
        <Loader active size="big" />
      </div>
    );
  }

  return (
    <div className={classNames(styles.wrapper, styles.wrapperFlex, styles.wrapperBoard)}>
      <BoardContainer />
    </div>
  );
}

Static.propTypes = {
  projectId: PropTypes.string,
  cardId: PropTypes.string,
  board: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  projects: PropTypes.array, // eslint-disable-line react/forbid-prop-types
};

Static.defaultProps = {
  projectId: undefined,
  cardId: undefined,
  board: undefined,
  projects: [],
};

export default Static;
