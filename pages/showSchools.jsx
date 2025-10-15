import useSWR from 'swr';

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error: ${res.status} ${text}`);
  }
  return res.json();
};

export default function ShowSchools() {
  const { data, error, isLoading } = useSWR('/api/schools', fetcher);

  if (error) return <div style={{ textAlign: 'center', marginTop: 50 }}>❌ Failed to load data</div>;
  if (isLoading || !data) return <div style={{ textAlign: 'center', marginTop: 50 }}>Loading...</div>;

  if (data.length === 0)
    return <div style={{ textAlign: 'center', marginTop: 50 }}>No schools added yet.</div>;

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: 'auto' }}>
      <h1>School Directory</h1>
      <div className="grid">
        {data.map((s) => {
          // fix for possible wrong image path (e.g. "public/schoolImages/...") from API
          const imageSrc = s.image?.replace(/^public\//, '') || '/globe.svg';

          return (
            <div className="card" key={s.id}>
              <div className="imgwrap">
                <img
                  src={imageSrc.startsWith('/') ? imageSrc : `/${imageSrc}`}
                  alt={s.name || 'school image'}
                  onError={(e) => (e.currentTarget.src = '/globe.svg')}
                />
              </div>
              <div className="info">
                <h3>{s.name}</h3>
                <p>{s.address}</p>
                <p><strong>{s.city}</strong></p>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        .card {
          border: 1px solid #ddd;
          border-radius: 10px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .card:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .imgwrap {
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #fafafa;
        }
        .imgwrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .info {
          padding: 12px 16px;
        }
        h3 {
          margin: 0 0 6px 0;
          color: #333;
        }
        p {
          margin: 4px 0;
          color: #555;
        }
      `}</style>
    </div>
  );
}
