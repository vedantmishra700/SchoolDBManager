'use client';

import { useEffect, useState } from 'react';

type School = {
  id: number;
  name?: string;
  address?: string;
  city?: string;
  image?: string;
};

export default function Home() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch('/api/schools')
      .then(async (res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        setSchools(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error(err);
        if (mounted) setError('Failed to load schools');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const normalizeSrc = (raw?: string) => {
    if (!raw) return '/globe.svg'; // your placeholder in public/
    // remove leading "public/" if the API saved that by mistake
    const cleaned = raw.replace(/^public\//, '');
    return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (error) return <div style={{ padding: 20, color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Schools</h1>

      {schools.length === 0 ? (
        <p>No schools found</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {schools.map((school) => (
            <li key={school.id} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <img
                src={normalizeSrc(school.image)}
                alt={school.name || 'school image'}
                width={60}
                height={45}
                style={{ objectFit: 'cover', borderRadius: 6 }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/globe.svg'; }}
              />
              <div>
                <div style={{ fontWeight: 700 }}>{school.name || '—'}</div>
                <div style={{ color: '#555' }}>{school.city ? `${school.city}, ` : ''}{school.address || ''}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
