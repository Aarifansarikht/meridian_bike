import { memo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { PALETTES } from '../../config/configurationOptions.js';
import { getBikeOptions } from '../../config/bikes.js';
import { selectCurrentBike } from '../../store/selectors.js';
import { useConfiguratorActions, useOptionValue } from '../../hooks/useBikeConfiguration.js';
import { describeValue } from '../../utils/formatConfiguration.js';
import ColorPicker from './controls/ColorPicker.jsx';
import MaterialSelector from './controls/MaterialSelector.jsx';
import OptionSelector from './controls/OptionSelector.jsx';
import ToggleControl from './controls/ToggleControl.jsx';
import TextureSelector from './controls/TextureSelector.jsx';

/** Maps a declarative option (config/bikes.js) to the matching reusable control. */
function OptionControl({ option }) {
  const bike = useSelector(selectCurrentBike);
  const value = useOptionValue(option.id) ?? option.default;
  const { setOption } = useConfiguratorActions();
  const onChange = useCallback((v) => setOption(option.id, v), [setOption, option.id]);

  switch (option.type) {
    case 'color': {
      const matchSource = option.match && getBikeOptions(bike).find((o) => o.id === option.match);
      return (
        <ColorPicker
          label={option.label}
          value={value}
          onChange={onChange}
          swatches={PALETTES[option.palette] ?? []}
          factoryLabel={option.factoryLabel}
          match={option.match}
          matchLabel={matchSource ? `Match ${matchSource.label.toLowerCase()}` : undefined}
          hint={option.hint}
          price={option.price}
          valueLabel={describeValue(bike, option, value)}
        />
      );
    }
    case 'finish':
      return <MaterialSelector label={option.label} value={value} onChange={onChange} choices={option.choices} hint={option.hint} />;
    case 'texture':
      return <TextureSelector label={option.label} value={value} onChange={onChange} choices={option.choices} hint={option.hint} />;
    case 'choice':
      return <OptionSelector label={option.label} value={value} onChange={onChange} choices={option.choices} hint={option.hint} />;
    case 'toggle':
      return <ToggleControl label={option.label} value={value} onChange={onChange} hint={option.hint} price={option.price} />;
    default:
      return null;
  }
}

export default memo(OptionControl);
