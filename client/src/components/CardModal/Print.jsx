import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'semantic-ui-react';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';

const PrintCardModal = React.forwardRef((props, ref) => {
  const [t] = useTranslation();
  const printCardRef = useRef(null);

  const print = useReactToPrint({
    contentRef: printCardRef,
  });

  return (
    <div className="print-card">
      <Button className="show" onClick={print}>
        {t('action.print')}
      </Button>
      <hr />
      <div ref={printCardRef}>
        <div ref={ref} className="print-card">
          <img
            className="ui"
            src={props.project.backgroundImage.url}
            alt={props.project.name}
            style={{ height: '3em', marginLeft: '0.5em' }}
          />
          <br />
          <h4>Lucrare: {props.name}</h4>
          <div className={props.hideDescription ? 'hide-description' : ''}>{props.header}</div>
          <br />
          <strong>Servicii:</strong>
          <br />
          <hr />
          {props.items}
          {props.count ? '' : <em>Nu</em>}
        </div>
      </div>
    </div>
  );
});

PrintCardModal.propTypes = {
  name: PropTypes.string.isRequired,
  project: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  header: PropTypes.element.isRequired,
  items: PropTypes.element.isRequired,
  count: PropTypes.number.isRequired,
  hideDescription: PropTypes.bool.isRequired,
};

export default PrintCardModal;
