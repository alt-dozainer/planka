import pick from 'lodash/pick';
import React, { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { Link, useLocation } from 'react-router-dom';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { Button, Icon } from 'semantic-ui-react';
import { closePopup, usePopup } from '../../lib/popup';

import Paths from '../../constants/Paths';
import DroppableTypes from '../../constants/DroppableTypes';
import AddStep from './AddStep';
import EditStep from './EditStep';
// import LabelsStep from '../LabelsStep';

import styles from './Boards.module.scss';
import globalStyles from '../../styles.module.scss';

const Boards = React.memo(
  ({
    items,
    currentId,
    canEdit,
    onCreate,
    onUpdate,
    onMove,
    onDelete,
    currentUser,
    // allLabels,
    // onLabelCreate,
    // onLabelUpdate,
    // onLabelMove,
    // onLabelDelete,
  }) => {
    const { t } = useTranslation();
    const { search: searchParams } = useLocation();
    const tabsWrapper = useRef(null);
    //
    // const LabelsPopup = usePopup(LabelsStep);

    const handleWheel = useCallback(({ deltaY }) => {
      tabsWrapper.current.scrollBy({
        left: deltaY,
      });
    }, []);

    const handleDragStart = useCallback(() => {
      closePopup();
    }, []);

    const handleDragEnd = useCallback(
      ({ draggableId, source, destination }) => {
        if (!destination || source.index === destination.index) {
          return;
        }

        onMove(draggableId, destination.index);
      },
      [onMove],
    );

    const handleUpdate = useCallback(
      (id, data) => {
        onUpdate(id, data);
      },
      [onUpdate],
    );

    const handleDelete = useCallback(
      (id) => {
        onDelete(id);
      },
      [onDelete],
    );

    // const handleLabelSelect = (e) => {
    //   console.log('label', e);
    // };

    const isHidden = (item = { name: '' }) => item.name.indexOf('_') === 0;
    const currentBoardIsHidden = isHidden(items.find((i) => i.id === currentId));

    const AddPopup = usePopup(AddStep);
    const EditPopup = usePopup(EditStep);
    //
    const viewCalendarPath = `${currentId}?v=events`;
    const viewCalendar = searchParams.indexOf('v=events') >= 0;

    const itemss = [...items, { name: 'dummy', id: 'dummy', view: 'events' }];
    const itemsNode = itemss.map((item, index) => (
      <Draggable
        key={item.id}
        draggableId={item.id}
        index={index}
        isDragDisabled={!item.isPersisted || !canEdit || isHidden(item)}
      >
        {({ innerRef, draggableProps, dragHandleProps }) => (
          <div
            {...draggableProps} // eslint-disable-line react/jsx-props-no-spreading
            ref={innerRef}
            className={classNames(
              styles.tabWrapper,
              currentUser.isAdmin || !isHidden(item) ? '' : styles.tabHide,
              isHidden(item) ? styles.tabFloatRight : styles.tabFloatLeft,
            )}
            // style={
            //   {
            //     // float: isHidden(item) ? 'right' : 'left',
            //     // display: currentUser.isAdmin || !isHidden(item) ? '' : 'none',
            //   }
            // }
          >
            <div
              className={classNames(
                styles.tab,
                ((item.id === currentId && !viewCalendar) ||
                  (item.view === 'events' && viewCalendar)) &&
                  `${styles.tabActive}`,
              )}
            >
              {
                // eslint-disable-next-line
                item.isPersisted && item.name !== 'dummy' ? (
                  <>
                    <Link
                      // {...(isHidden(item) ? {} : dragHandleProps)} // eslint-disable-line react/jsx-props-no-spreading
                      {...dragHandleProps} // eslint-disable-line react/jsx-props-no-spreading
                      to={Paths.BOARDS.replace(':id', item.id)}
                      title={item.name}
                      className={styles.link}
                    >
                      <Icon fitted name="tags" className="tab-icon" />
                      &nbsp;&nbsp;&nbsp;
                      {isHidden(item) ? item.name.replaceAll('_', ' ') : item.name}
                    </Link>
                    {canEdit && (
                      <EditPopup
                        defaultData={pick(item, 'name')}
                        onUpdate={(data) => handleUpdate(item.id, data)}
                        onDelete={() => handleDelete(item.id)}
                      >
                        <Button className={classNames(styles.editButton, styles.target)}>
                          <Icon fitted name="pencil" size="small" />
                        </Button>
                      </EditPopup>
                    )}
                  </>
                ) : item.name === 'dummy' && !currentBoardIsHidden ? (
                  // <LabelsPopup
                  //   items={allLabels}
                  //   currentIds={[]}
                  //   title="Test"
                  //   onCreate={onLabelCreate}
                  //   onSelect={handleLabelSelect}
                  //   onDeselect={handleLabelSelect}
                  //   onUpdate={onLabelUpdate}
                  //   onMove={onLabelMove}
                  //   onDelete={onLabelDelete}
                  // >
                  //   {/* <span className={styles.link}>{item.name}</span> */}
                  //   <Link
                  //     to={Paths.BOARDS.replace(':id', viewCalendarPath)}
                  //     title={item.name}
                  //     className={styles.link}
                  //   >
                  //     {item.name}
                  //   </Link>
                  // </LabelsPopup>
                  <Link
                    to={Paths.BOARDS.replace(':id', viewCalendarPath)}
                    title={item.name}
                    className={`${styles.link} ${globalStyles.backgroundRedCurtain}`}
                    style={{ paddingRight: 20 }}
                  >
                    <Icon fitted name="calendar alternate" className="tab-icon" />
                    &nbsp;&nbsp;&nbsp;
                    {t('agenda')}
                  </Link>
                ) : (
                  !currentBoardIsHidden && (
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    <span {...dragHandleProps} className={styles.link}>
                      {item.name}
                    </span>
                  )
                )
              }
            </div>
          </div>
        )}
      </Draggable>
    ));

    return (
      <div className={styles.wrapper} onWheel={handleWheel}>
        <div ref={tabsWrapper} className={styles.tabsWrapper}>
          <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <Droppable droppableId="boards" type={DroppableTypes.BOARD} direction="horizontal">
              {({ innerRef, droppableProps, placeholder }) => (
                // eslint-disable-next-line react/jsx-props-no-spreading
                <div {...droppableProps} ref={innerRef} className={styles.tabs}>
                  {itemsNode}
                  {placeholder}
                  {canEdit && (
                    <AddPopup onCreate={onCreate}>
                      <Button icon="plus" className={styles.addButton} />
                    </AddPopup>
                  )}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    );
  },
);

Boards.propTypes = {
  items: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  currentId: PropTypes.string,
  canEdit: PropTypes.bool.isRequired,
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onMove: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  allLabels: PropTypes.array, // eslint-disable-line react/forbid-prop-types
  onLabelCreate: PropTypes.func.isRequired,
  onLabelUpdate: PropTypes.func.isRequired,
  onLabelMove: PropTypes.func.isRequired,
  onLabelDelete: PropTypes.func.isRequired,
  currentUser: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

Boards.defaultProps = {
  currentId: undefined,
  allLabels: undefined,
  currentUser: undefined,
};

export default Boards;
