import { Text, TextInput } from 'react-native';

export default function setGlobalFont() {

  const TextRender = Text.render;
  const TextInputRender = TextInput.render;

  Text.render = function (...args) {
    const origin = TextRender.call(this, ...args);
    return {
      ...origin,
      props: {
        ...origin.props,
        style: [{ fontFamily: 'Roboto-Regular' }, origin.props.style],
      },
    };
  };

  TextInput.render = function (...args) {
    const origin = TextInputRender.call(this, ...args);
    return {
      ...origin,
      props: {
        ...origin.props,
        style: [{ fontFamily: 'Roboto-Regular' }, origin.props.style],
      },
    };
  };

}