import { useDispatch, useSelector } from 'react-redux';
import { updateColor } from '../features/theme';

export function useTheme() {
  const dispatch = useDispatch();
  const color = useSelector((state) => state.theme.value);
  const setColor = (newColor) => dispatch(updateColor(newColor));
  return { color, setColor };
}
