import React, { useCallback, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from 'semantic-ui-react';
import { usePopup } from '../../lib/popup';
import { Input } from '../../lib/custom-ui';

import User from '../User';
import Label from '../Label';
import BoardMembershipsStep from '../BoardMembershipsStep';
import LabelsStep from '../LabelsStep';

import styles from './Filters.module.scss';
import globalStyles from '../../styles.module.scss';

const Filters = React.memo(
  ({
    users,
    labels,
    filterText,
    allBoardMemberships,
    allLabels,
    canEdit,
    onUserAdd,
    onUserRemove,
    onLabelAdd,
    onLabelRemove,
    onLabelCreate,
    onLabelUpdate,
    onLabelMove,
    onLabelDelete,
    onTextFilterUpdate,
    currentBoard,
  }) => {
    const [t] = useTranslation();
    const navigate = useNavigate();
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const { search: searchParams, pathname } = useLocation();

    const TODAY = `=${t('today')}`;
    const THIS_WEEK = `=${t('thisWeek')}`;
    const DUE = `=${t('due')}`;

    const viewToday = searchParams.indexOf(`v${TODAY}`) >= 0;
    const viewWeek = searchParams.indexOf(`v${THIS_WEEK}`) >= 0;
    const viewDue = searchParams.indexOf(`v${DUE}`) >= 0;

    const boardIsHidden = currentBoard.name.indexOf('_') >= 0;

    const searchFieldRef = useRef(null);

    const cancelSearch = useCallback(() => {
      onTextFilterUpdate('');
      searchFieldRef.current.blur();
    }, [onTextFilterUpdate]);

    const handleRemoveUserClick = useCallback(
      (id) => {
        onUserRemove(id);
      },
      [onUserRemove],
    );

    const handleRemoveLabelClick = useCallback(
      (id) => {
        onLabelRemove(id);
      },
      [onLabelRemove],
    );

    const handleSearchChange = useCallback(
      (_, { value }) => {
        onTextFilterUpdate(value);
      },
      [onTextFilterUpdate],
    );

    const handleSearchFocus = useCallback(() => {
      setIsSearchFocused(true);
    }, []);

    const handleSearchKeyDown = useCallback(
      (event) => {
        if (event.key === 'Escape') {
          cancelSearch();
        }
      },
      [cancelSearch],
    );

    const handleSearchBlur = useCallback(() => {
      setIsSearchFocused(false);
    }, []);

    const handleCancelSearchClick = useCallback(() => {
      cancelSearch();
    }, [cancelSearch]);

    const BoardMembershipsPopup = usePopup(BoardMembershipsStep);
    const LabelsPopup = usePopup(LabelsStep);

    const isSearchActive = isSearchFocused;

    //
    if (viewToday) {
      onTextFilterUpdate(TODAY);
    }
    if (viewWeek) {
      onTextFilterUpdate(THIS_WEEK);
    }
    if (viewDue) {
      onTextFilterUpdate(DUE);
    }

    return (
      <>
        <span className={styles.filter}>
          <BoardMembershipsPopup
            items={allBoardMemberships}
            currentUserIds={users.map((user) => user.id)}
            title="common.filterByMembers"
            onUserSelect={onUserAdd}
            onUserDeselect={onUserRemove}
          >
            <button type="button" className={styles.filterButton}>
              <span className={styles.filterTitle}>{`${t('common.members')}:`}</span>
              {users.length === 0 && <span className={styles.filterLabel}>{t('common.all')}</span>}
            </button>
          </BoardMembershipsPopup>
          {users.map((user) => (
            <span key={user.id} className={styles.filterItem}>
              <User
                name={user.name}
                avatarUrl={user.avatarUrl}
                size="tiny"
                onClick={() => handleRemoveUserClick(user.id)}
              />
            </span>
          ))}
        </span>
        <span className={styles.filter}>
          <LabelsPopup
            items={allLabels}
            currentIds={labels.map((label) => label.id)}
            title="common.filterByLabels"
            canEdit={canEdit}
            onSelect={onLabelAdd}
            onDeselect={onLabelRemove}
            onCreate={onLabelCreate}
            onUpdate={onLabelUpdate}
            onMove={onLabelMove}
            onDelete={onLabelDelete}
          >
            <button type="button" className={styles.filterButton}>
              <span className={styles.filterTitle}>{`${t('common.labels')}:`}</span>
              {labels.length === 0 && <span className={styles.filterLabel}>{t('common.all')}</span>}
            </button>
          </LabelsPopup>
          {labels.map((label) => (
            <span key={label.id} className={styles.filterItem}>
              <Label
                name={label.name}
                color={label.color}
                size="small"
                onClick={() => handleRemoveLabelClick(label.id)}
              />
            </span>
          ))}
        </span>
        <span className={styles.filter}>
          <Input
            ref={searchFieldRef}
            value={filterText}
            placeholder={t('common.searchCards')}
            icon={
              isSearchActive ? (
                <Icon link name="cancel" onClick={handleCancelSearchClick} />
              ) : (
                'search'
              )
            }
            className={classNames(styles.search, !isSearchActive && styles.searchInactive)}
            onFocus={handleSearchFocus}
            onKeyDown={handleSearchKeyDown}
            onChange={handleSearchChange}
            onBlur={handleSearchBlur}
          />
        </span>

        {!boardIsHidden && (
          <>
            <span className={styles.filter}>
              <button
                type="button"
                className={styles.filterButton}
                onClick={() => {
                  setIsSearchFocused(false);
                  if (filterText !== TODAY) {
                    onTextFilterUpdate(TODAY);
                    navigate(`${pathname}?v${TODAY}`);
                  } else {
                    onTextFilterUpdate('');
                    navigate(`${pathname}`);
                  }
                }}
              >
                <span
                  className={classNames(
                    styles.filterLabel,
                    filterText === TODAY ? globalStyles.backgroundGreenEyes : '',
                  )}
                >
                  {t('today_title')}
                </span>
              </button>
            </span>

            <span className={styles.filter}>
              <button
                type="button"
                className={styles.filterButton}
                onClick={() => {
                  setIsSearchFocused(false);
                  if (filterText !== THIS_WEEK) {
                    onTextFilterUpdate(THIS_WEEK);
                    navigate(`${pathname}?v${THIS_WEEK}`);
                  } else {
                    onTextFilterUpdate('');
                    navigate(`${pathname}`);
                  }
                }}
              >
                <span
                  className={classNames(
                    styles.filterLabel,
                    filterText === THIS_WEEK ? globalStyles.backgroundSourPeel : '',
                  )}
                >
                  {t('thisWeek_title')}
                </span>
              </button>
            </span>

            <span className={styles.filter}>
              <button
                type="button"
                className={styles.filterButton}
                onClick={() => {
                  setIsSearchFocused(false);
                  if (filterText !== DUE) {
                    onTextFilterUpdate(DUE);
                    navigate(`${pathname}?v${DUE}`);
                  } else {
                    onTextFilterUpdate('');
                    navigate(`${pathname}`);
                  }
                }}
              >
                <span
                  className={classNames(
                    styles.filterLabel,
                    filterText === DUE ? globalStyles.backgroundRedCurtain : '',
                  )}
                >
                  {t('due_title')}
                </span>
              </button>
            </span>
          </>
        )}
      </>
    );
  },
);

Filters.propTypes = {
  /* eslint-disable react/forbid-prop-types */
  users: PropTypes.array.isRequired,
  labels: PropTypes.array.isRequired,
  filterText: PropTypes.string.isRequired,
  allBoardMemberships: PropTypes.array.isRequired,
  allLabels: PropTypes.array.isRequired,
  /* eslint-enable react/forbid-prop-types */
  canEdit: PropTypes.bool.isRequired,
  onUserAdd: PropTypes.func.isRequired,
  onUserRemove: PropTypes.func.isRequired,
  onLabelAdd: PropTypes.func.isRequired,
  onLabelRemove: PropTypes.func.isRequired,
  onLabelCreate: PropTypes.func.isRequired,
  onLabelUpdate: PropTypes.func.isRequired,
  onLabelMove: PropTypes.func.isRequired,
  onLabelDelete: PropTypes.func.isRequired,
  onTextFilterUpdate: PropTypes.func.isRequired,
  currentBoard: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
};

export default Filters;
