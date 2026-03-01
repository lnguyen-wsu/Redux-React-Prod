import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWeather } from '../features/weather';

export function useWeather() {
  const dispatch = useDispatch();
  const weather = useSelector((state) => state.weather.value);
  const status = useSelector((state) => state.weather.status);
  const error = useSelector((state) => state.weather.error);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchWeather());
    }
  }, [dispatch, status]);

  return { weather, status, error };
}
