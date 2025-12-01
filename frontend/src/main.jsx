import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

function formatDate(ts){
	if(!ts) return '—';
	const d = new Date(ts);
	const pad = (n)=>String(n).padStart(2,'0');
	return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function App(){
	const [content,setContent] = useState('');
	const [loading,setLoading] = useState(true);
	const [saving,setSaving] = useState(false);
	const [lastLoadedAt,setLastLoadedAt] = useState(null);
	const [lastSavedAt,setLastSavedAt] = useState(null);
	const [error,setError] = useState('');
	const textareaRef = useRef(null);

	const statusText = useMemo(()=>{
		if(saving) return 'Saving...';
		if(loading) return 'Loading...';
		return error ? `Error: ${error}` : 'Ready';
	},[saving,loading,error]);

	useEffect(()=>{
		(async()=>{
			try{
				setLoading(true);
				const res = await fetch('/api/note');
				if(!res.ok) throw new Error('Failed to load');
				const data = await res.json();
				setContent(data.content || '');
				setLastLoadedAt(data.updatedAt || null);
				setError('');
			}catch(err){
				setError(err.message || 'Failed to load');
			}finally{
				setLoading(false);
				setTimeout(()=>textareaRef.current?.focus(), 0);
			}
		})();
	},[]);

	async function save(){
		try{
			setSaving(true);
			const res = await fetch('/api/note',{
				method:'POST',
				headers:{'Content-Type':'application/json'},
				body:JSON.stringify({ content })
			});
			if(!res.ok) throw new Error('Failed to save');
			const data = await res.json();
			setLastSavedAt(data.savedAt || Date.now());
			setError('');
		}catch(err){
			setError(err.message || 'Failed to save');
		}finally{
			setSaving(false);
		}
	}

	return (
		<div className="container">
			<div className="header">
				<div>
					<div className="title">Notepad</div>
					<div className="subtitle">A super simple local file storage notepad (Node.js + React)</div>
				</div>
				<div className="status">{statusText}</div>
			</div>

			<div className="card">
				<div className="toolbar">
					<button className="btn" onClick={()=>window.location.reload()} disabled={loading || saving}>Reload</button>
					<div className="spacer" />
					<span className="status">Last loaded: {formatDate(lastLoadedAt)}</span>
				</div>

				<textarea
					ref={textareaRef}
					className="editor"
					placeholder="Start recording your ideas, todos, or fragments..."
					value={content}
					onChange={(e)=>setContent(e.target.value)}
					disabled={loading}
				/>

				<div className="footer">
					<span className="status" style={{marginRight:12}}>Last saved: {formatDate(lastSavedAt)}</span>
					<button className="btn primary" onClick={save} disabled={saving || loading}>Save</button>
				</div>
			</div>

			<div className="tips">Data is saved in the server's `data/note.txt` file, suitable for local testing or minimal deployment.</div>
		</div>
	);
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);


