import { useEffect, useState } from 'react';
import { fetchGreeting } from './app.ts';

export function App() {
  const [greeting, setGreeting] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchGreeting()
      .then((data) => {
        setGreeting(data);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  return (
    <>
      {error} {greeting}
    </>
  );
}

export default App;
