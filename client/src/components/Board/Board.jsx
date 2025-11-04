import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { Container } from 'semantic-ui-react';

// import FullCalendar from '@fullcalendar/react';
// import dayGridPlugin from '@fullcalendar/daygrid';
// import timeGridPlugin from '@fullcalendar/timegrid';
// import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
// import interactionPlugin from '@fullcalendar/interaction';
// import roLocale from '@fullcalendar/core/locales/ro';

import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
// import Agenda from 'react-big-calendar/lib/Agenda';
import moment from 'moment'; // eslint-disable-line
import 'moment/locale/ro'; // eslint-disable-line

import { closePopup } from '../../lib/popup';
import Paths from '../../constants/Paths';

import DroppableTypes from '../../constants/DroppableTypes';
import ListContainer from '../../containers/ListContainer';
import StatusColors, { getTranslationKey } from '../../constants/StatusColors';
import CardModalContainer from '../../containers/CardModalContainer';
import ListAdd from './ListAdd';
import Tasks from '../Card/Tasks';
import { ReactComponent as PlusMathIcon } from '../../assets/images/plus-math-icon.svg';

import styles from './Board.module.scss';
import globalStyles from '../../styles.module.scss';

moment.locale('ro');

function NoEvents() {
  return <i>Nu sunt programări</i>;
}

// function CustomAgenda(props) {
//   const { date } = props;
//   const startDate = moment(date).startOf('day').toDate();
//   const endDate = moment(date).endOf('day').toDate();
//   return <Agenda {...props} range={[startDate, endDate]} />; // eslint-disable-line
// }
// CustomAgenda.propTypes = {
//   date: PropTypes.instanceOf(Date).isRequired,
// };

const messages = {
  ro: {
    week: 'Săptămână',
    work_week: 'Săptămână lucrătoare',
    day: 'Zi',
    month: 'Lună',
    previous: '<',
    next: '>',
    today: 'Azi',
    agenda: 'Agendă',
    allDay: 'Toată ziua',
    noEventsInRange: <NoEvents />,
  },
};

const formats = {
  agendaHeaderFormat: ({ start }) => `${moment(start).format('ddd ll')}`,
};

const resourceMap = [
  { resourceId: 1, resourceTitle: 'Folie/PPF/Colantări/Diverse' },
  { resourceId: 2, resourceTitle: 'Faruri' },
  { resourceId: 3, resourceTitle: 'Detailing' },
];

// const { search } = window.location;
const parseDndId = (dndId) => dndId.split(':')[1];
// let heightReset = false;

const createEvent = ({ e, t, getListByName, onCardCreate, time, day }) => {
  if (!time) return;
  const plannedList = getListByName(t('status.planned'));
  const resourceId = +e.target.getAttribute('data-resource-id');
  // console.log('creating', resourceId, '@', time);

  if (plannedList) {
    const listId = plannedList.id;
    const data = {
      name: t('scheduled'),
      dueDate: day || time,
      description: `{ "resourceId": ${resourceId} }`,
    };
    const autoOpen = true;
    // console.log('creating', data);
    onCardCreate(listId, data, autoOpen);
  } else {
    // console.log('no planned list');
  }
};

function Events({ events, resourceId, initialView, tasks }) {
  const { i18n } = useTranslation();
  const statuses = i18n.options.resources[i18n.language].translation.status;

  const getDescription = (description) => {
    let p = {};
    try {
      p = JSON.parse(description || '{}');
    } catch (e) {
      p = { description };
    }
    return p.description;
  };

  const getEventColor = (event) => {
    const defaultColor =
      globalStyles[StatusColors[getTranslationKey(statuses, event.extendedProps?.listName)]];
    const colorFromLabel = event.extendedProps?.labels?.length
      ? globalStyles[
          `background${upperFirst(camelCase(event.extendedProps?.labels?.[event.extendedProps?.labels?.findLastIndex((label) => label.name.indexOf('>') === 0)]?.color))}`
        ]
      : defaultColor;
    return colorFromLabel || defaultColor;
  };

  return (
    <Container className="events" data-resource-id={resourceId}>
      {(events || [])
        .filter((event) => event.resourceId === resourceId)
        .map((event, i) =>
          event.title !== 'Programează' ? (
            <div
              className="rbc-event"
              key={event.id}
              title={initialView !== Views.AGENDA ? event.title : null}
            >
              <Link
                to={Paths.CARDS.replace(
                  ':id',
                  `${event.id}${'?v=events,agenda,'}${event.es.toISOString()}`,
                )}
                className={`event-title ${getEventColor(event)} shadow`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="gradient" />
                <span>{event.title}</span>
                <span className="event-labels">
                  {event.extendedProps?.labels?.map((label) => (
                    <span key={`event-label-${label.id}`}>
                      &nbsp;
                      <span
                        className={globalStyles[`background${upperFirst(camelCase(label.color))}`]}
                      >
                        {label.name}
                      </span>
                    </span>
                  ))}
                </span>
                <Tasks items={tasks(event.id) || []} noProgress />
                <div className="description">{getDescription(event.description)}</div>
                <div className="circle" />
              </Link>
            </div>
          ) : (
            <span key={i}>&nbsp;</span> // eslint-disable-line
          ),
        )}
    </Container>
  );
}
Events.propTypes = {
  events: PropTypes.array.isRequired, // eslint-disable-line
  resourceId: PropTypes.number.isRequired,
  // getListByName: PropTypes.func.isRequired,
  initialView: PropTypes.string.isRequired,
  tasks: PropTypes.func.isRequired,
};

const onClickCalendar = ({ e, t, onCardCreate, onCardUpdate, getListByName, day }) => {
  const time = e.target.innerText;
  // console.log('click', time, day);
  const [hours, minutes] = time.split(':');

  day.setHours(hours);
  day.setMinutes(minutes);
  createEvent({ e, t, onCardCreate, onCardUpdate, getListByName, time, day });
};

const onClickResource = ({ e, t, onCardCreate, onCardUpdate, getListByName }) => {
  // const resource = e.target.innerText;
  // console.log('resource', resource);
  // const resourceId = resourceMap.find((r) => r.resourceTitle === resource)?.resourceId;
  const initialDate = window.location.search.split(',')[2] || new Date().toISOString();
  const defaultTime = new Date(initialDate);
  defaultTime.setHours(8);
  defaultTime.setMinutes(0);

  e.stopPropagation();
  createEvent({ e, t, onCardCreate, onCardUpdate, getListByName, time: defaultTime });
};

function EventAgenda({ event: ev, getListByName, onCardCreate, onCardUpdate, initialView, tasks }) {
  const { t } = useTranslation();

  return (
    <div className="agenda" onClick={(e) => createEvent({ e, t, getListByName, onCardCreate, onCardUpdate, time: ev.es })} role="generic"> {/* eslint-disable-line */}
      <React.Fragment key={ev.id}>
        {resourceMap.map((resource) => (
          <div // eslint-disable-line
            data-resource-id={resource.resourceId}
            key={resource.resourceId}
            className="header"
            onClick={(e) => onClickResource({ e, t, getListByName, onCardCreate, onCardUpdate })}
          >
            {resource.resourceTitle}
          </div>
        ))}
        {resourceMap.map((resource) => (
          <Events
            events={ev.events || []}
            resourceId={resource.resourceId}
            getListByName={getListByName}
            initialView={initialView}
            tasks={tasks}
          />
        ))}
        {/* <Events
          events={ev.events || []}
          resourceId={1}
          getListByName={getListByName}
          initialView={initialView}
          tasks={tasks}
        />
        <Events
          events={ev.events || []}
          resourceId={2}
          getListByName={getListByName}
          initialView={initialView}
          tasks={tasks}
        />
        <Events
          events={ev.events || []}
          resourceId={3}
          getListByName={getListByName}
          initialView={initialView}
          tasks={tasks}
        /> */}
      </React.Fragment>
    </div>
  );
}
EventAgenda.propTypes = {
  event: PropTypes.object.isRequired, // eslint-disable-line
  getListByName: PropTypes.func.isRequired,
  onCardCreate: PropTypes.func.isRequired,
  onCardUpdate: PropTypes.func.isRequired,
  initialView: PropTypes.string.isRequired,
  tasks: PropTypes.func.isRequired,
};

function AgendaTime(props) {
  const { t } = useTranslation();
  const { label, onCardCreate, onCardUpdate, getListByName, day } = props;
  const now = moment().format('HH:mm');
  return (<div // eslint-disable-line
      className="event-time"
      onClick={(e) => onClickCalendar({ e, t, onCardCreate, onCardUpdate, getListByName, day })}
    >
      {label === now ? 'azi' : label}
    </div>
  );
}
AgendaTime.propTypes = {
  label: PropTypes.string.isRequired,
  getListByName: PropTypes.func.isRequired,
  onCardCreate: PropTypes.func.isRequired,
  onCardUpdate: PropTypes.func.isRequired,
  day: PropTypes.instanceOf(Date).isRequired,
};

const mapEvents2 = (events) =>
  events.map((event) => {
    const now = new Date();
    const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    utc.setHours(8 + now.getTimezoneOffset() / 60 - now.getTimezoneOffset() / 60);
    utc.setMinutes(0);
    utc.setSeconds(0);
    utc.setMilliseconds(0);
    const start = event.dueDate
      ? new Date(
          Date.UTC(
            event.dueDate.getUTCFullYear(),
            event.dueDate.getUTCMonth(),
            event.dueDate.getUTCDate(),
            event.dueDate.getUTCHours(),
            event.dueDate.getUTCMinutes(),
            event.dueDate.getUTCSeconds(),
          ),
        )
      : new Date();
    // : utc; // undefined;
    let resourceId = 0;
    try {
      resourceId = event.description ? JSON.parse(event.description)?.resourceId : resourceId;
    } catch (e) {
      //
    }

    return {
      resourceId:
        resourceMap.find((resource) =>
          // event.labels?.[(event.labels?.length || 1) - 1]?.name === resource.resourceTitle,
          event.labels?.find((label) => label.name === resource.resourceTitle),
        )?.resourceId ||
        resourceId ||
        1,
      id: event.id,
      title: event.name,
      start,
      end: start ? new Date(start.getTime()).setHours(start.getHours() + 1) : new Date(), // undefined,
      es: start,
      extendedProps: {
        some: 'prop',
        listName: event.listName,
        labels: event.labels,
      },
      backgroundColor: '#ffffff',
      // textColor: '#ffffff',
      display: 'block',
      description: event.description,
    };
  });

const mapEvents3 = (events) =>
  events.reduce((groups, event) => {
    const existingGroup = groups.find((group) => {
      // group.es.setMinutes(0);
      group.es.setSeconds(0);
      group.es.setMilliseconds(0);
      // event.start.setMinutes(0);
      event.start.setSeconds(0);
      event.start.setMilliseconds(0);
      return (
        group.es.getTime() === event.start.getTime() &&
        (group.start === moment(event.start).format('HH:mm') ||
          (group.start === 'allday' && !event.start))
      );
    });

    if (existingGroup) {
      existingGroup.events.push(event);
    } else {
      groups.push({
        id: groups.length + 100, // Generate unique group IDs
        title: `group ${groups.length + 1}`,
        start: event.start ? moment(event.start).format('HH:mm') : 'allday',
        events: [event],
        end: event.start
          ? new Date(event.start.getTime()).setHours(event.start.getHours() + 0)
          : undefined,
        es: event.start,
      });
    }

    return groups;
  }, []);

const Board = React.memo(
  ({
    listIds,
    isCardModalOpened,
    isCurrentUserManager,
    canEdit,
    onListCreate,
    onListMove,
    onCardMove,
    events,
    getListByName,
    onCardCreate,
    onCardUpdate,
    // onLabelAdd,
    // allLabels,
    filterText,
    selectTasks,
  }) => {
    const { t } = useTranslation();
    const { search: searchParams } = useLocation();
    const location = useLocation();
    const navigate = useNavigate();
    const [isListAddOpened, setIsListAddOpened] = useState(false);
    // const [rKey, setRKey] = useState(0);
    const [initialView, setInitialView] = useState(
      location.search.split(',')[1] !== 'undefined'
        ? location.search.split(',')[1] || 'agenda'
        : 'agenda',
    );
    const [initialDate, setInitialDate] = useState(
      location.search.split(',')[2] !== 'undefined'
        ? location.search.split(',')[2] || new Date().toISOString()
        : new Date().toISOString(),
    );
    const [events2, setEvents2] = useState(mapEvents2(events));
    const [events3, setEvents3] = useState(mapEvents3(events2));

    // EVENTS
    // console.log('EVENTS (cards)', events);

    // grouped (agenda)

    const [resources, setResources] = useState(resourceMap);
    const [calendarEvents, setCalendarEvents] = useState(events3);

    // const calendarRef = React.createRef();

    const viewCalendar = searchParams.indexOf('v=events') >= 0;

    const wrapper = useRef(null);
    const prevPosition = useRef(null);

    // const statuses = i18n.options.resources[i18n.language].translation.status;

    // useEffect(() => {
    //   setTimeout(() => {
    //     setRKey((r) => r + 1);
    //   }, 10);
    // }, []);

    // useEffect(() => {
    //   if (isCardModalOpened === false) {
    //     setRKey((r) => r + 1);
    //   }
    // }, [isCardModalOpened]);

    useEffect(() => {
      setEvents2(
        mapEvents2(
          events.filter(
            (event) =>
              event.name.toLocaleLowerCase().indexOf(filterText.toLocaleLowerCase()) >= 0 ||
              event.description?.toLocaleLowerCase().indexOf(filterText.toLocaleLowerCase()) >= 0,
          ),
        ),
      );
    }, [events, filterText]);

    useEffect(() => {
      setEvents3(mapEvents3(events2));
    }, [events2]);

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

    // function renderEventContent(eventInfo) {
    //   const { id } = eventInfo.event;
    //   return (
    //     <Link
    //       to={Paths.CARDS.replace(':id', `${id}${search}`)}
    //       className={`event-title ${globalStyles[StatusColors[getTranslationKey(statuses, eventInfo.event.extendedProps.listName)]]}`}
    //     >
    //       <b>{eventInfo.timeText}</b>
    //       &nbsp;
    //       <i title={eventInfo.event.title}>{eventInfo.event.title}</i>
    //       <span className="event-labels">
    //         {eventInfo.event.extendedProps?.labels?.map((label) => (
    //           <span key={`event-label-${label.id}`}>
    //             &nbsp;
    //             <span className={globalStyles[`background${upperFirst(camelCase(label.color))}`]}>
    //               {label.name}
    //             </span>
    //           </span>
    //         ))}
    //       </span>
    //     </Link>
    //   );
    // }

    // function onClickDate(e) {
    //   console.log('EVENT', e);
    // }

    // function onChangeEvent(e) {
    //   onCardUpdate(e.event.id, {
    //     dueDate: e.event.start,
    //   });
    // }

    // function handleDateSelect(e) {
    //   const plannedList = getListByName(t('status.planned'));
    //   const y = e.jsEvent.clientY;
    //   let foundSlot = null;
    //   let [hours, minutes, seconds] = '8:00:00'.split(':');

    //   const timeSlots = document.querySelectorAll(`.fc-timegrid-slot-lane`);
    //   timeSlots.forEach((timeSlot) => {
    //     const by = timeSlot.getBoundingClientRect().y;
    //     if (by + timeSlot.clientHeight > y && by < y) {
    //       foundSlot = timeSlot;
    //     }
    //   });
    //   if (foundSlot) {
    //     console.log('slot', foundSlot.getAttribute('data-time'));
    //     [hours, minutes, seconds] = foundSlot.getAttribute('data-time').split(':');
    //     e.start.setHours(hours);
    //     e.start.setMinutes(minutes);
    //     e.start.setSeconds(seconds);
    //   }
    //   if (plannedList) {
    //     const listId = plannedList.id;
    //     // e.start.setHours(8);
    //     const data = {
    //       name: t('scheduled'),
    //       dueDate: e.start,
    //     };

    //     const autoOpen = true;
    //     // onCardCreate(listId, data, autoOpen);
    //   } else {
    //     // console.log('no planned list');
    //   }
    // }

    // const resetRowHeights = (e) => {
    //   if (e) {
    //     navigate(
    //       `${location.pathname}${location.search.replace(/v=events(.*)/, `v=events,${e.view.type},${e.startStr}`)}`,
    //     );
    //   }

    //   const timeSlots = document.querySelectorAll(`.fc-timegrid-slot`);
    //   timeSlots.forEach((timeSlot) => {
    //     timeSlot.style.height = 'auto'; // eslint-disable-line
    //   });
    // };

    // const adjustRowHeights = (e) => {
    //   setTimeout(() => {
    //     const timeSlot = document.querySelector(
    //       `.fc-timegrid-slot-lane[data-time*="${e.timeText}"]`,
    //     );
    //     if (timeSlot) {
    //       const currentHeight = timeSlot.clientHeight;
    //       timeSlot.style.height = `${currentHeight + 26}px`; // a
    //     }
    //   }, 0);
    // };

    // const renderEventClasses = (e) => {
    //   const isHalfSlot = e.timeText?.split(':')?.[1];
    //   const eventHarness = document.querySelector(`.event-title[href^="/cards/${e.event.id}"]`)
    //     ?.parentElement?.parentElement?.parentElement;
    //   if (eventHarness && isHalfSlot) {
    //     const { inset } = eventHarness.style;
    //     // eventHarness.style.inset = inset.replace(/(\d)+/, parseInt(inset, 10) - 20);
    //   }
    // };

    const views = ['month', 'week', 'agenda'];
    const localizer = momentLocalizer(moment);

    // function adjustSlotHeight(_events) {
    //   // Helper function to get events for a specific hour
    //   const eventsByHour = _events.reduce((acc, event) => {
    //     const hour = moment(event.start).hour();
    //     acc[hour] = acc[hour] || [];
    //     acc[hour].push(event);
    //     return acc;
    //   }, {});

    //   return Object.keys(eventsByHour).map((hour) => ({
    //     hour,
    //     eventCount: eventsByHour[hour].length,
    //   }));
    // }

    // const hourSlotData = adjustSlotHeight(events2);

    const onChangeView = useCallback(
      (e) => {
        if (e === Views.WEEK || e === Views.MONTH) {
          // setTimeout(() => {
          //   setResources(undefined);
          //   // setCalendarEvents(events2);
          // }, 220);
          setResources(undefined);
        } else {
          setResources(resourceMap);
          setCalendarEvents(events3);
        }
        setInitialView(e);
        const date = window.location.search.split(',')[2];
        navigate(
          `${location.pathname}${location.search.replace(/v=events(.*)/, `v=events,${e},${date}`)}`,
        );
      },
      [events3, location, navigate],
    );

    const insertEmptyEvent = (e) => {
      // const eee = new Date(e.getTime());
      // eee.setHours(0);
      // eee.setMinutes(0);
      // eee.setSeconds(0);
      // eee.setMilliseconds(0);

      // const evs = events3.filter((event) => {
      //   if (event.es) {
      //     const ev = new Date(event.es.getTime());
      //     ev.setHours(0);
      //     ev.setMinutes(0);
      //     ev.setSeconds(0);
      //     ev.setMilliseconds(0);
      //     return ev.getTime() === eee.getTime();
      //   }
      //   return false;
      // });

      const workingHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
      const ev2 = [...events3];

      workingHours.forEach((slot) => {
        const currentSlot = new Date(e.getTime());
        currentSlot.setHours(slot);
        currentSlot.setMinutes(0);
        currentSlot.setSeconds(0);
        currentSlot.setMilliseconds(0);

        const evs = events3.filter((event) => {
          if (event.es) {
            const ev = new Date(event.es.getTime());
            // ev.setHours(0);
            // ev.setMinutes(0);
            ev.setSeconds(0);
            ev.setMilliseconds(0);
            return ev.getTime() === currentSlot.getTime();
          }
          return false;
        });

        if (!evs.length) {
          if (!evs[0]?.title !== 'Programează') {
            const ee = currentSlot;
            ev2.push({
              id: ev2.length + 1,
              title: 'Programează',
              es: ee,
              start: moment(ee).format('HH:mm'),
              end: ee ? new Date(ee.getTime()).setHours(ee.getHours() + 0) : new Date(),
              events: [
                {
                  id: ev2.length + 2,
                  resourceId: 1,
                  title: 'Programează',
                  es: ee,
                  start: ee,
                  end: ee ? new Date(ee.getTime()).setHours(ee.getHours() + 0) : new Date(),
                },
              ],
            });
          }
        }
      });
      setCalendarEvents(ev2);

      // if (!evs.length) {
      //   const ev2 = [...events3];
      //   if (!evs[0]?.title !== 'Programează') {
      //     const ee = new Date(e.getTime());
      //     ee.setHours(8);
      //     ee.setMinutes(0);
      //     ev2.push({
      //       id: ev2.length + 1,
      //       title: 'Programează',
      //       es: ee,
      //       start: moment(ee).format('HH:mm'),
      //       end: ee ? new Date(ee.getTime()).setHours(ee.getHours() + 0) : new Date(),
      //       events: [
      //         {
      //           id: ev2.length + 2,
      //           resourceId: 1,
      //           title: 'Programează',
      //           es: ee,
      //           start: ee,
      //           end: ee ? new Date(ee.getTime()).setHours(ee.getHours() + 0) : new Date(),
      //         },
      //       ],
      //     });
      //   }
      //   setCalendarEvents(ev2);
      // }
    };

    useEffect(() => {
      // setCalendarEvents(events3);
      insertEmptyEvent(new Date(initialDate));
    }, [events3]); // eslint-disable-line

    const onChangeDate = (e) => {
      const eee = new Date(e.getTime());
      eee.setUTCHours(0);
      eee.setUTCMinutes(0);
      eee.setUTCSeconds(0);
      eee.setUTCMilliseconds(0);

      setInitialDate(eee.toISOString());
      const view = window.location.search.split(',')[1];
      navigate(
        `${location.pathname}${location.search.replace(/v=events(.*)/, `v=events,${view},${eee.toISOString()}`)}`,
      );
      if (view === Views.AGENDA) {
        setTimeout(() => {
          // setCalendarEvents(events3);
        }, 10);
        setTimeout(() => {
          insertEmptyEvent(e);
        }, 0);
      }
    };

    useEffect(() => {
      setTimeout(() => {
        if (initialView === Views.AGENDA) {
          insertEmptyEvent(new Date(initialDate));
        }
      }, 150);
      onChangeView(initialView);
    }, []); // eslint-disable-line

    const onCardCreateIfAllowed = (...params) => {
      if (isCurrentUserManager) {
        return onCardCreate(...params);
      }
      return () => {};
    };

    return viewCalendar ? (
      <>
        <div className="calendar-wrapper">
          {/* <FullCalendar
            key={rKey}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, resourceTimeGridPlugin]}
            initialView={initialView}
            initialDate={initialDate}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,resourceTimeGridDay',
            }}
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
            resources={[
              { id: 'Colantări', title: 'Colantări' },
              { id: 'Folii', title: 'Folii' },
              { id: 'Faruri', title: 'Faruri' },
            ]}
            eventDidMount={(e) => {
              adjustRowHeights(e);
            }}
            eventWillUnmount={(e) => {
              // console.log('unmount', e);
              // resetRowHeights();
            }}
            // eventClassNames={renderEventClasses}
            datesSet={(e) => {
              resetRowHeights(e);
            }}
            slotLabelInterval="00:30"
            slotLabelFormat={{
              hour: 'numeric',
              minute: '2-digit',
              omitZeroMinute: false,
              meridiem: 'short',
            }}
            ref={calendarRef}
          /> */}

          <Calendar
            culture="ro"
            messages={messages.ro}
            defaultDate={initialDate}
            defaultView={initialView}
            events={calendarEvents}
            startAccessor="es"
            endAccessor="end"
            localizer={localizer}
            resourceIdAccessor="resourceId"
            resources={resources}
            resourceTitleAccessor="resourceTitle"
            tooltipAccessor={null}
            step={30}
            views={views}
            length={1}
            // components={{
            //   timeSlotWrapper: ({ children, value }) => { // eslint-disable-line
            //     const eventHour = moment(value).hour();
            //     const matchedSlot = hourSlotData.find((slot) => +slot.hour === eventHour);
            //     console.log('event ===', eventHour, matchedSlot, hourSlotData);
            //     const dynamicHeight = matchedSlot
            //       ? `${20 + matchedSlot.eventCount * 20}px`
            //       : '20px';

            //     return (
            //       <div style={{ height: dynamicHeight, borderBottom: '1px solid #ddd' }}>
            //         {children}
            //       </div>
            //     );
            //   },
            // }}
            components={{
              agenda: {
                event: (props) =>
                  EventAgenda({
                    ...props,
                    tasks: selectTasks,
                    getListByName,
                    onCardCreate: onCardCreateIfAllowed,
                    onCardUpdate,
                    initialView,
                  }),
                time: (props) =>
                  AgendaTime({
                    ...props,
                    tasks: selectTasks,
                    getListByName,
                    onCardCreate: onCardCreateIfAllowed,
                    onCardUpdate,
                    initialView,
                  }),
              },
              month: {
                event: (props) =>
                  EventAgenda({
                    ...props,
                    tasks: selectTasks,
                    getListByName,
                    onCardCreate: onCardCreateIfAllowed,
                    onCardUpdate,
                    initialView,
                  }),
              },
              week: {
                event: (props) =>
                  EventAgenda({
                    ...props,
                    tasks: selectTasks,
                    getListByName,
                    onCardCreate: onCardCreateIfAllowed,
                    onCardUpdate,
                    initialView,
                  }),
              },
              // agenda: CustomAgenda,
            }}
            onView={onChangeView}
            min={new Date(1970, 1, 1, 8, 0, 0)}
            max={new Date(1970, 1, 1, 19, 0, 0)}
            onNavigate={onChangeDate}
            drilldownView="agenda"
            formats={formats}
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
                    {canEdit && isCurrentUserManager && (
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
  isCurrentUserManager: PropTypes.bool.isRequired,
  canEdit: PropTypes.bool.isRequired,
  onListCreate: PropTypes.func.isRequired,
  onListMove: PropTypes.func.isRequired,
  onCardMove: PropTypes.func.isRequired,
  events: PropTypes.array, // eslint-disable-line react/forbid-prop-types
  getListByName: PropTypes.func,
  onCardCreate: PropTypes.func.isRequired,
  onCardUpdate: PropTypes.func.isRequired,
  allLabels: PropTypes.array, // eslint-disable-line react/forbid-prop-types
  onLabelAdd: PropTypes.func,
  filterText: PropTypes.string,
  selectTasks: PropTypes.func,
};

Board.defaultProps = {
  events: [],
  getListByName: () => undefined,
  allLabels: [],
  onLabelAdd: () => undefined,
  filterText: '',
  selectTasks: () => [],
};

export default Board;
