import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import roLocale from '@fullcalendar/core/locales/ro';
import { closePopup } from '../../lib/popup';
import Paths from '../../constants/Paths';

import DroppableTypes from '../../constants/DroppableTypes';
import ListContainer from '../../containers/ListContainer';
import StatusColors, { getTranslationKey } from '../../constants/StatusColors';
import CardModalContainer from '../../containers/CardModalContainer';
import ListAdd from './ListAdd';
import { ReactComponent as PlusMathIcon } from '../../assets/images/plus-math-icon.svg';

import styles from './Board.module.scss';
import globalStyles from '../../styles.module.scss';

const parseDndId = (dndId) => dndId.split(':')[1];

const Board = React.memo(
  ({
    listIds,
    isCardModalOpened,
    canEdit,
    onListCreate,
    onListMove,
    onCardMove,
    events,
    getListByName,
    onCardCreate,
    onCardUpdate,
  }) => {
    const { t, i18n } = useTranslation();
    const { search: searchParams } = useLocation();
    const [isListAddOpened, setIsListAddOpened] = useState(false);

    const viewCalendar = searchParams.indexOf('v=events') >= 0;

    const wrapper = useRef(null);
    const prevPosition = useRef(null);

    const statuses = i18n.options.resources[i18n.language].translation.status;

    const handleAddListClick = useCallback(() => {
      setIsListAddOpened(true);
    }, []);

    const handleAddListClose = useCallback(() => {
      setIsListAddOpened(false);
    }, []);

    const handleDragStart = useCallback(() => {
      closePopup();
    }, []);

    const handleDragEnd = useCallback(
      ({ draggableId, type, source, destination }) => {
        if (
          !destination ||
          (source.droppableId === destination.droppableId && source.index === destination.index)
        ) {
          return;
        }

        const id = parseDndId(draggableId);

        switch (type) {
          case DroppableTypes.LIST:
            onListMove(id, destination.index);

            break;
          case DroppableTypes.CARD:
            onCardMove(id, parseDndId(destination.droppableId), destination.index);

            break;
          default:
        }
      },
      [onListMove, onCardMove],
    );

    const handleMouseDown = useCallback(
      (event) => {
        // If button is defined and not equal to 0 (left click)
        if (event.button) {
          return;
        }

        if (event.target !== wrapper.current && !event.target.dataset.dragScroller) {
          return;
        }

        prevPosition.current = event.clientX;
      },
      [wrapper],
    );

    const handleWindowMouseMove = useCallback(
      (event) => {
        if (!prevPosition.current) {
          return;
        }

        event.preventDefault();

        window.scrollBy({
          left: prevPosition.current - event.clientX,
        });

        prevPosition.current = event.clientX;
      },
      [prevPosition],
    );

    const handleWindowMouseUp = useCallback(() => {
      prevPosition.current = null;
    }, [prevPosition]);

    useEffect(() => {
      document.body.style.overflowX = 'auto';

      return () => {
        document.body.style.overflowX = null;
      };
    }, []);

    useEffect(() => {
      if (isListAddOpened) {
        window.scroll(document.body.scrollWidth, 0);
      }
    }, [listIds, isListAddOpened]);

    useEffect(() => {
      window.addEventListener('mouseup', handleWindowMouseUp);
      window.addEventListener('mousemove', handleWindowMouseMove);

      return () => {
        window.removeEventListener('mouseup', handleWindowMouseUp);
        window.removeEventListener('mousemove', handleWindowMouseMove);
      };
    }, [handleWindowMouseUp, handleWindowMouseMove]);

    // console.log('EVENTS (cards)', events);
    const todayStr = new Date().toISOString().replace(/T.*$/, ''); // YYYY-MM-DD of today
    const events2 = events.map((event) => ({
      id: event.id,
      title: event.name,
      start: event.dueDate || todayStr,
      extendedProps: {
        some: 'prop',
        listName: event.listName,
        labels: event.labels,
      },
      backgroundColor: '#ffffff',
      // textColor: '#ffffff',
      display: 'block',
    }));

    function renderEventContent(eventInfo) {
      const { id } = eventInfo.event;
      return (
        <Link
          to={Paths.CARDS.replace(':id', `${id}?v=events`)}
          className={`event-title ${globalStyles[StatusColors[getTranslationKey(statuses, eventInfo.event.extendedProps.listName)]]}`}
        >
          <b>{eventInfo.timeText}</b>
          &nbsp;
          <i title={eventInfo.event.title}>{eventInfo.event.title}</i>
          <span className="event-labels">
            {eventInfo.event.extendedProps?.labels?.map((label) => (
              <span key={`event-label-${label.id}`}>
                &nbsp;
                <span className={globalStyles[`background${upperFirst(camelCase(label.color))}`]}>
                  {label.name}
                </span>
              </span>
            ))}
          </span>
        </Link>
      );
    }

    function onClickDate() {
      // console.log('EVENT', e);
    }

    function onChangeEvent(e) {
      onCardUpdate(e.event.id, {
        dueDate: e.event.start,
      });
    }

    function handleDateSelect(e) {
      const plannedList = getListByName(t('status.planned'));

      if (plannedList) {
        const listId = plannedList.id;
        e.start.setHours(8);
        const data = {
          name: t('scheduled'),
          dueDate: e.start,
        };

        const autoOpen = true;
        onCardCreate(listId, data, autoOpen);
      } else {
        // console.log('no planned list');
      }
    }

    return viewCalendar ? (
      <>
        <div className="calendar-wrapper">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            // buttonText={{
            //   today
            // }}
            locale={roLocale}
            events={events2}
            // dayMaxEvents
            dayMaxEventRows={5}
            eventContent={renderEventContent} // eslint-disable-line
            eventClick={onClickDate} // eslint-disable-line
            eventChange={onChangeEvent} // eslint-disable-line
            select={handleDateSelect} // eslint-disable-line
            selectable
            editable
          />
        </div>
        {isCardModalOpened && <CardModalContainer />}
      </>
    ) : (
      <>
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div ref={wrapper} className={styles.wrapper} onMouseDown={handleMouseDown}>
          <div>
            <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <Droppable droppableId="board" type={DroppableTypes.LIST} direction="horizontal">
                {({ innerRef, droppableProps, placeholder }) => (
                  <div
                    {...droppableProps} // eslint-disable-line react/jsx-props-no-spreading
                    data-drag-scroller
                    ref={innerRef}
                    className={styles.lists}
                  >
                    {listIds.map((listId, index) => (
                      <ListContainer key={listId} id={listId} index={index} />
                    ))}
                    {placeholder}
                    {canEdit && (
                      <div data-drag-scroller className={styles.list}>
                        {isListAddOpened ? (
                          <ListAdd onCreate={onListCreate} onClose={handleAddListClose} />
                        ) : (
                          <button
                            type="button"
                            className={styles.addListButton}
                            onClick={handleAddListClick}
                          >
                            <PlusMathIcon className={styles.addListButtonIcon} />
                            <span className={styles.addListButtonText}>
                              {listIds.length > 0
                                ? t('action.addAnotherList')
                                : t('action.addList')}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
        {isCardModalOpened && <CardModalContainer />}
      </>
    );
  },
);

Board.propTypes = {
  listIds: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  isCardModalOpened: PropTypes.bool.isRequired,
  canEdit: PropTypes.bool.isRequired,
  onListCreate: PropTypes.func.isRequired,
  onListMove: PropTypes.func.isRequired,
  onCardMove: PropTypes.func.isRequired,
  events: PropTypes.array, // eslint-disable-line react/forbid-prop-types
  getListByName: PropTypes.func,
  onCardCreate: PropTypes.func.isRequired,
  onCardUpdate: PropTypes.func.isRequired,
};

Board.defaultProps = {
  events: [],
  getListByName: () => undefined,
};

export default Board;
