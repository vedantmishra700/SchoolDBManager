import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function AddSchool() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [preview, setPreview] = useState(null);
  const router = useRouter();

  const onSubmit = async (data) => {
    setLoading(true);
    setMsg('');

    try {
      // Build FormData explicitly to handle FileList correctly
      const formData = new FormData();
      formData.append('name', data.name || '');
      formData.append('address', data.address || '');
      formData.append('city', data.city || '');
      formData.append('state', data.state || '');
      formData.append('contact', data.contact || '');
      formData.append('email_id', data.email_id || '');

      // Handle file input (react-hook-form provides FileList)
      if (data.image && data.image.length > 0) {
        const file = data.image[0];

        // optional client-side checks
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          setMsg('Image is too large (max 5MB).');
          setLoading(false);
          return;
        }

        formData.append('image', file);
      }

      const res = await fetch('/api/schools', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        setMsg('School added successfully!');
        reset();            // clear form
        setPreview(null);   // clear preview
        // redirect to listing after short delay so user sees msg
        setTimeout(() => router.push('/showSchools'), 700);
      } else {
        setMsg(json.message || `Error: ${res.status}`);
      }
    } catch (e) {
      console.error(e);
      setMsg('Network or server error.');
    } finally {
      setLoading(false);
    }
  };

  // local preview handler for the file input
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ maxWidth: 800, margin: 'auto', padding: 20 }}>
      <h1>Add School</h1>
      <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
        <div>
          <label>School Name*</label>
          <input {...register('name', { required: 'Name is required' })} />
          {errors.name && <p className="err">{errors.name.message}</p>}
        </div>

        <div>
          <label>Address*</label>
          <textarea {...register('address', { required: 'Address is required' })} />
          {errors.address && <p className="err">{errors.address.message}</p>}
        </div>

        <div>
          <label>City*</label>
          <input {...register('city', { required: 'City is required' })} />
          {errors.city && <p className="err">{errors.city.message}</p>}
        </div>

        <div>
          <label>State</label>
          <input {...register('state')} />
        </div>

        <div>
          <label>Contact (digits)</label>
          <input {...register('contact', {
            pattern: { value: /^[0-9]{7,15}$/, message: 'Invalid contact number' }
          })} />
          {errors.contact && <p className="err">{errors.contact.message}</p>}
        </div>

        <div>
          <label>Email</label>
          <input {...register('email_id', {
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' }
          })} />
          {errors.email_id && <p className="err">{errors.email_id.message}</p>}
        </div>

        <div>
          <label>Image (optional)</label>
          <input
            type="file"
            accept="image/*"
            {...register('image')}
            onChange={(e) => {
              // keep react-hook-form's ref behavior but also show preview
              handleFileChange(e);
            }}
          />
          {preview && (
            <div style={{ marginTop: 8 }}>
              <small>Preview:</small>
              <div style={{ marginTop: 6 }}>
                <img src={preview} alt="preview" style={{ maxWidth: 200, maxHeight: 160, objectFit: 'cover' }} />
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add School'}</button>
        {msg && <p className="msg">{msg}</p>}
      </form>

      <style jsx>{`
        label { display:block; margin-top:12px; font-weight:600; }
        input, textarea { width:100%; padding:8px; margin-top:6px; }
        button { margin-top:16px; padding:10px 14px; border-radius:6px; }
        .err { color: red; margin: 6px 0 0; }
        .msg { color: green; margin-top: 12px; }
        @media (max-width:600px) {
          div { padding: 8px; }
        }
      `}</style>
    </div>
  );
}
