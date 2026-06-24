import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Heart,
  Search,
  Shield,
  Film,
  Tv,
  BookOpen,
  LogIn,
  LogOut,
  PlusCircle,
  CheckCircle2
} from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  updateDoc
} from 'firebase/firestore';
import { auth, db, provider } from './firebase';
import { seedWarnings, cancerTags } from './seedData';
import './styles.css';

const intensities = ['All', 'Mild', 'Moderate', 'High', 'Very High'];
const types = ['All', 'Movie', 'TV Show', 'Book'];

const OWNER_EMAIL = "rnatasha103@aol.com";

function normalize(value) {
  return String(value || '').toLowerCase();
}

function getIcon(type) {
  if (type === 'Tv Show') return <Tv size={18} />;
  if (type === 'Book') return <BookOpen size={18} />;
  return <Film size={18} />;
}

function useWarnings() {
  const [warnings, setWarnings] = useState(seedWarnings);
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    async function loadWarnings() {
      try {
        const q = query(
          collection(db, 'warnings'),
          where('status', '==', 'approved')
        );

        const snapshot = await getDocs(q);
        const rows = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (rows.length > 0) {
          setWarnings(rows);
        } else {
          setWarnings(seedWarnings);
        }

        setFirebaseReady(true);
      } catch (error) {
        console.error('Firestore warning load failed:', error);
        setWarnings(seedWarnings);
        setFirebaseReady(false);
      }
    }

    loadWarnings();
  }, []);

  return { warnings, firebaseReady };
}

function Header({ user, onLogIn, onLogOut, onAdminToggle }) {
  return (
    <header className="hero">
      <nav className="nav">
        <div className="brand">
          <span className="brandIcon">
            <Heart size={22} />
          </span>
          Watch With Care
        </div>

        <div className="navActions">
          {user?.email ===
            "rnatasha103@aol.com" && (
              <button className="ghostBtn"
                onClick={onAdminToggle}>
                Review
              </button>
                )}
          <button className="ghostBtn" onClick={user ? onLogOut : onLogIn}>
            {user ? <LogOut size={18} /> : <LogIn size={18} />}
            {user ? "Sign out" : "Sign in"}
          </button>
        </div>
      </nav>

      <div className="heroGrid">
        <section>
          <p className="eyebrow"
            style={{ fontSize: '1.25rem' }}
            >Cancer-informed content warnings</p>
          <h1>Content warnings for the stories that hit too close to home.</h1>
          <p className="lead">
            Search movies, TV shows, and books for compassionate warnings about cancer,
            terminal illness, death, grief, hospice, and medical trauma.
          </p>

          <div className="pills">
            <span><Shield size={16} /> Spoiler-free first</span>
            <span><Heart size={16} /> Built with care</span>
            <span><CheckCircle2 size={16} /> Community powered</span>
          </div>
        </section>

        <aside className="missionCard">
          <h3>Mission</h3>
          <p>
            Give cancer fighters, thrivers, survivors, caregivers, and grieving families
            the agency to choose what they watch or read — without surprise emotional
            landmines.
          </p>
        </aside>
      </div>
    </header>
  );
}

function WarningCard({ item }) {
  const [open, setOpen] = useState(false);

    return (
  <article
    className="warningCard"
    style={{
      background: "#ffffff",
      border: "2px solid rgba(17, 24, 63, 0.18)",
      borderRadius: "22px",
      boxShadow: "0 12px 28px rgba(17, 24, 63, 0.12)",
      padding: "20px",
      marginBottom: "20px"
    }}
  >
      <div className="cardTop">
        <div className="mediaIcon">{getIcon(item.type)}</div>
        <div>
          <h3>{item.title}</h3>
          <p className="meta">
            {item.type}
            {item.year ? ` • ${item.year}` : ''}
          </p>
        </div>

        <span className={`intensity ${normalize(item.intensity).replaceAll(' ', '-')}`}>
          {item.intensity}
        </span>
      </div>

      <p className="spoilerFree">
        {item.spoilerFree || item.spoilerFreeWarning || 'No spoiler-free warning submitted yet.'}
      </p>

      <div className="tags">
        {(item.tags || []).map(tag => (
          <span key={tag}>{tag}</span>
        ))}
      </div>

      <button className="detailsBtn" onClick={() => setOpen(!open)}>
        {open ? 'Hide spoiler details' : 'Show spoiler details'}
      </button>

      {open && (
        <div className="spoiler">
          <strong>Spoiler details:</strong>{' '}
          {item.spoilerDetails || 'No spoiler details submitted yet.'}
        </div>
      )}

      {item.notes && (
        <div className="spoiler">
          <strong>Notes:</strong> {item.notes}
        </div>
      )}
    </article>
  );
}

function SearchAndResults({ warnings, firebaseReady }) {
  const [term, setTerm] = useState('');
  const [type, setType] = useState('All');
  const [intensity, setIntensity] = useState('All');
  const [tag, setTag] = useState('All');

  const allTags = useMemo(() => {
    const tags = new Set();

    warnings.forEach(item => {
      (item.tags || []).forEach(t => tags.add(t));
    });

    return ['All', ...Array.from(tags).sort()];
  }, [warnings]);

  const filtered = useMemo(() => {
    return warnings.filter(item => {
      const searchText = [
        item.title,
        item.type,
        item.year,
        item.intensity,
        item.spoilerFree,
        item.spoilerFreeWarning,
        item.spoilerDetails,
        item.notes,
        ...(item.tags || [])
      ].join(' ');

      const matchesTerm = normalize(searchText).includes(normalize(term));
      const matchesType = type === 'All' || item.type === type;
      const matchesIntensity = intensity === 'All' || item.intensity === intensity;
      const matchesTag = tag === 'All' || (item.tags || []).includes(tag);

      return matchesTerm && matchesType && matchesIntensity && matchesTag;
    });
  }, [warnings, term, type, intensity, tag]);

  return (
    <section className="searchPanel">
      <div className="searchBox">
        <Search size={18} />
        <input
          value={term}
          onChange={e => setTerm(e.target.value)}
          placeholder="Search by title, trigger, character, or warning..."
        />
      </div>

      <div className="filters">
        <select value={type} onChange={e => setType(e.target.value)}>
          {types.map(option => (
            <option key={option}>{option}</option>
          ))}
        </select>

        <select value={intensity} onChange={e => setIntensity(e.target.value)}>
          {intensities.map(option => (
            <option key={option}>{option}</option>
          ))}
        </select>

        <select value={tag} onChange={e => setTag(e.target.value)}>
          {allTags.map(option => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </div>

      <p className="resultCount">
        {filtered.length} result{filtered.length === 1 ? '' : 's'} •{' '}
        {firebaseReady ? 'Shared database connected' : 'Shared database needs Firebase setup'}
      </p>

      <div className="grid">
        {filtered.map(item => (
          <WarningCard key={item.id || item.title} item={item} />
        ))}
      </div>
    </section>
  );
}

function SubmitWarning({ user }) {
  const [form, setForm] = useState({
    title: '',
    type: '',
    year: '',
    intensity: '',
    tags: [],
    spoilerFree: '',
    spoilerDetails: '',
    notes: ''
  });

  const [status, setStatus] = useState('');

  function toggleTag(tag) {
    setForm(current => {
      const hasTag = current.tags.includes(tag);

      return {
        ...current,
        tags: hasTag
          ? current.tags.filter(t => t !== tag)
          : [...current.tags, tag]
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('');

    if (!user) {
      setStatus('Please sign in before submitting a warning.');
      return;
    }

    try {
      await addDoc(collection(db, 'warnings'), {
        ...form,
        status: 'pending',
        submittedBy: user.email || '',
        createdAt: serverTimestamp()
      });

      setForm({
        title: '',
        type: '',
        year: '',
        intensity: '',
        tags: [],
        spoilerFree: '',
        spoilerDetails: '',
        notes: ''
      });

      setStatus('Thank you. Your warning was submitted for review.');
    } catch (error) {
      console.error('Submission failed:', error);
      setStatus('Something went wrong. Please try again.');
    }
  }

  return (
    <section className="submitPanel">
      <h2>
        <PlusCircle size={22} />
        Submit a warning
      </h2>

      <p>
        Submissions are saved as pending so the app owner can review before publishing.
      </p>

      {!user && (
        <p className="notice">
          Please sign in before submitting a community warning.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="formGrid">
          <input
            required
            placeholder="Title"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
          />

          <input
            placeholder="Year or season"
            value={form.year}
            onChange={e => setForm({ ...form, year: e.target.value })}
          />

         <select
  value={form.type}
  onChange={e => setForm({ ...form, type: e.target.value })}
>
  <option value="">Content type</option>
  {types.filter(option => option !== 'All').map(option => (
    <option key={option} value={option}>{option}</option>
  ))}
</select>

        <select
  value={form.intensity}
  onChange={e => setForm({ ...form, intensity: e.target.value })}
>
  <option value="">Intensity level</option>
  {intensities.filter(option => option !== 'All').map(option => (
    <option key={option} value={option}>{option}</option>
  ))}
</select>
        </div>

        <textarea
          required
          placeholder="Spoiler-free warning"
          value={form.spoilerFree}
          onChange={e => setForm({ ...form, spoilerFree: e.target.value })}
        />

        <textarea
          placeholder="Spoiler details"
          value={form.spoilerDetails}
          onChange={e => setForm({ ...form, spoilerDetails: e.target.value })}
        />

        <textarea
          placeholder="Notes for viewers, caregivers, or parents"
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
        />

        <div className="tagPicker">
          {cancerTags.map(tag => (
            <button
              type="button"
              key={tag}
              className={form.tags.includes(tag) ? 'tag active' : 'tag'}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <button className="submitBtn" type="submit">
          Submit for review
        </button>

        {status && <p className="status">{status}</p>}
      </form>
    </section>
  );
}

function AdminReview() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  async function loadPending() {
    setLoading(true);
    try {
      const q = query(
        collection(db, "warnings"),
        where("status", "==", "pending")
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setPending(items);
    } catch (error) {
      console.error("Failed to load pending:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPending();
  }, []);

  function startEdit(item) {
    setEditingId(item.id);
    setEditForm({
      title: item.title || "",
      year: item.year || "",
      type: item.type || "Movie",
      intensity: item.intensity || "Moderate",
      spoilerFree: item.spoilerFree || item.spoilerFreeWarning || "",
      spoilerDetails: item.spoilerDetails || "",
      notes: item.notes || "",
      tagsText: (item.tags || []).join(", ")
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEdit(id) {
    try {
      await updateDoc(doc(db, "warnings", id), {
        title: editForm.title,
        year: editForm.year,
        type: editForm.type,
        intensity: editForm.intensity,
        spoilerFree: editForm.spoilerFree,
        spoilerDetails: editForm.spoilerDetails,
        notes: editForm.notes,
        tags: editForm.tagsText
          .split(",")
          .map(tag => tag.trim())
          .filter(Boolean),
        updatedAt: serverTimestamp()
      });

      setEditingId(null);
      setEditForm({});
      await loadPending();
    } catch (error) {
      console.error("Save edit failed:", error);
      alert("Could not save edits. Check the console or Firebase rules.");
    }
  }

  async function changeStatus(id, status) {
    try {
      await updateDoc(doc(db, "warnings", id), {
        status,
        reviewedAt: serverTimestamp()
      });
      await loadPending();
    } catch (error) {
      console.error("Status update failed:", error);
      alert("Could not update status. Check the console or Firebase rules.");
    }
  }

  return (
    <main className="container">
      <section className="searchPanel">
        <h2>Pending submissions</h2>

        {loading && <p>Loading submissions...</p>}

        {!loading && pending.length === 0 && (
          <p>No pending submissions found.</p>
        )}

        <div className="grid">
          {pending.map(item => (
            <article className="warningCard" key={item.id}>
              {editingId === item.id ? (
                <>
                  <div className="formGrid">
                    <input
                      value={editForm.title}
                      onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                      placeholder="Title"
                    />

                    <input
                      value={editForm.year}
                      onChange={e => setEditForm({ ...editForm, year: e.target.value })}
                      placeholder="Year or season"
                    />

                    <select
                      value={editForm.type}
                      onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                    >
                      <option>Movie</option>
                      <option>TV Show</option>
                      <option>Book</option>
                      <option>Book/Movie</option>
                    </select>

                    <select
                      value={editForm.intensity}
                      onChange={e => setEditForm({ ...editForm, intensity: e.target.value })}
                    >
                      <option>Mild</option>
                      <option>Moderate</option>
                      <option>High</option>
                      <option>Very High</option>
                    </select>

                    <textarea
                      value={editForm.spoilerFree}
                      onChange={e => setEditForm({ ...editForm, spoilerFree: e.target.value })}
                      placeholder="Spoiler-free warning"
                    />

                    <textarea
                      value={editForm.spoilerDetails}
                      onChange={e => setEditForm({ ...editForm, spoilerDetails: e.target.value })}
                      placeholder="Spoiler details"
                    />

                    <textarea
                      value={editForm.notes}
                      onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                      placeholder="Notes"
                    />

                    <input
                      value={editForm.tagsText}
                      onChange={e => setEditForm({ ...editForm, tagsText: e.target.value })}
                      placeholder="Tags separated by commas"
                    />
                  </div>

                  <div className="adminActions">
                    <button className="submitBtn" type="button" onClick={() => saveEdit(item.id)}>
                      Save edits
                    </button>

                    <button className="detailsBtn" type="button" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="cardTop">
                    <div>
                      <h3>{item.title || "Untitled submission"}</h3>
                      <p className="meta">
                        {item.type} {item.year ? `• ${item.year}` : ""}
                      </p>
                    </div>

                    <span className={`intensity ${normalize(item.intensity).replaceAll(" ", "-")}`}>
                      {item.intensity || "No intensity"}
                    </span>
                  </div>

                  <p className="spoilerFree">
                    {item.spoilerFree || item.spoilerFreeWarning || "No spoiler-free warning submitted."}
                  </p>

                  {item.spoilerDetails && (
                    <div className="spoiler">
                      <strong>Spoiler details:</strong> {item.spoilerDetails}
                    </div>
                  )}

                  {item.notes && (
                    <div className="spoiler">
                      <strong>Notes:</strong> {item.notes}
                    </div>
                  )}

                  {item.tags?.length > 0 && (
                    <div className="tags">
                      {item.tags.map(tag => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="adminActions">
                    <button className="detailsBtn" type="button" onClick={() => startEdit(item)}>
                      Edit
                    </button>

                    <button className="submitBtn" type="button" onClick={() => changeStatus(item.id, "approved")}>
                      Approve
                    </button>

                    <button className="detailsBtn" type="button" onClick={() => changeStatus(item.id, "denied")}>
                      Deny
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
function App() {
  const { warnings, firebaseReady } = useWarnings();
  const [user, setUser] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
    });

    return () => unsub();
  }, []);

  async function LogIn() {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Sign-in failed:', error);
    }
  }

  async function LogOut() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
}

  return (
    <div>
      <Header
        user={user}
        onLogIn={LogIn}
        onLogOut={LogOut}
        onAdminToggle={() => setShowAdmin(!showAdmin)}
      />

      {showAdmin ? (
        <AdminReview />
      ) : (
        <div>
          <main className="container">
            <SearchAndResults warnings={warnings} firebaseReady={firebaseReady} />
            <SubmitWarning user={user} />
          </main>

          <footer>
  <p className="footer-tagline">
  Built with care by Radiant Transformations — for people who deserve to choose what their hearts are ready for.
</p>

  <a 
    href="https://radiant-transformations.com" 
    target="_blank" 
    rel="noopener noreferrer"
  >
    <img src="/radiant-logo.png" alt="Radiant Transformations logo" />
  </a>
</footer>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
